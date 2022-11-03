import path from 'path';
import connect from 'connect';
import serveStatic from 'serve-static';
import consola from 'consola';
import parseUrl from 'parseurl';
import isFunction from 'lodash/isFunction';
import createError from 'http-errors';
import createContext from './context';
import errorHandle from './utils/errorHandle';
import pkg from '../../package.json';

export default class Server {
  constructor(leafage) {
    const { options, renderer } = leafage;

    this.leafage = leafage;
    this.renderer = renderer;
    this.options = options;

    this.app = connect();

    this.ready = this.ready.bind(this);
    this.setupMiddleware = this.setupMiddleware.bind(this);
    this.render = this.render.bind(this);
    this.renderError = this.renderError.bind(this);
    this.useMiddleware = this.useMiddleware.bind(this);
    this.listen = this.listen.bind(this);

    if (options.dev) {
      // devMiddleware placeholder
      leafage.hook('server:devMiddleware', (devMiddleware) => {
        this.devMiddleware = devMiddleware;
      });
    }
  }

  async ready() {
    const { setupMiddleware } = this;

    // Setup middleware
    await setupMiddleware();
  }

  setupMiddleware() {
    const { options, render, renderError, useMiddleware } = this;
    const { dev, builder, dir, server } = options;

    let middlewares = [
      // add Powered-By
      (req, res, next) => {
        res.setHeader('X-Powered-By', `${pkg.name}/${pkg.version}`);

        next();
      }];

    if (dev) {
      // devMiddleware
      middlewares.push((req, res, next) => {
        const { devMiddleware } = this;
        if (devMiddleware) return devMiddleware(req, res, next);

        return next();
      });
    } else if (!builder.publicPath.startsWith('http')) {
      // client static
      middlewares.push({
        route: `${builder.publicPath}${dir.static}`,
        handle: serveStatic(path.join(dir.root, dir.dist, dir.static)),
      });
    }

    // Add user provided middleware
    middlewares = middlewares.concat(server.middleware);

    // Finally use router
    middlewares.push(render);

    // Setup user provided middleware
    middlewares = server.setupMiddleware(middlewares) || middlewares;

    // Error use router
    middlewares.push(renderError);

    middlewares.forEach(useMiddleware);
  }

  render(req, res, next) {
    const { renderer } = this;
    const { pathname, query } = parseUrl(req);
    const { name, params, styles, scripts } = renderer.matchResources(pathname);
    // check res
    if (name === '_error') {
      return next(createError(404));
    }

    try {
      const { Document, App, Component, getServerSideProps, config } = renderer.requireComponentConfig(name);
      // check method
      const method = req.method.toLowerCase();
      if (!config.methods.includes(method)) {
        return next(createError(404));
      }

      const ctx = { req, res, pathname, query, params };
      const assets = { name, styles, scripts, Document, App, Component };
      const context = createContext({ ctx, assets, renderer });

      if (!isFunction(getServerSideProps)) {
        return context.render(null);
      }

      return getServerSideProps(context);
    } catch (err) {
      if (err.name === 'URIError') {
        return next(createError(400, err));
      }
      return next(err);
    }
  }

  async renderError(err, req, res, next) {
    const { renderer } = this;
    const { pathname, query } = parseUrl(req);
    const viewName = '_error';
    const { styles, scripts } = renderer.getResources(viewName);

    try {
      const { Document, App, Component, getServerSideProps } = renderer.requireComponentConfig(viewName);

      const ctx = { req, res, pathname, query, params: {} };
      const assets = { name: viewName, styles, scripts, Document, App, Component };
      const context = createContext({ ctx, assets, renderer });

      const { statusCode, message } = errorHandle(err, req, res);

      if (!isFunction(getServerSideProps)) {
        return context.render({ statusCode, message });
      }

      const renderFn = (props) => context.render({ statusCode, message, ...props });
      return getServerSideProps({ ...context, render: renderFn });
    } catch (errInfo) {
      return next(errInfo);
    }
  }

  useMiddleware(middleware) {
    const { app, utils, useMiddleware } = this;

    // middleware path
    if (typeof middleware === 'string') {
      const middlewarePath = utils.resolveModule(middleware);
      return useMiddleware(utils.require(middlewarePath));
    }

    if (typeof middleware === 'object') {
      return app.use(middleware.route || '/', middleware.handle);
    }

    return app.use(middleware);
  }

  listen() {
    const { options, app } = this;
    const { host, port } = options.server;

    app.listen(port, host, () => {
      consola.ready({
        message: `Server listening on http://${host}:${port}`, badge: true,
      });
    });
  }
}
