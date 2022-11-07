import path from 'path';
import express from 'express';
import consola from 'consola';
import isFunction from 'lodash/isFunction';
import createError from 'http-errors';
import Utils from 'leafage/dist/common/Utils';
import createContext from './context';
import pkg from '../../package.json';

export default class Server {
  constructor(leafage) {
    const { options, renderer } = leafage;

    this.leafage = leafage;
    this.renderer = renderer;
    this.options = options;
    this.utils = new Utils(options);

    // 关闭版权并解决代理时取不到ip地址
    this.app = express().disable('x-powered-by').set('trust proxy', 'loopback');

    this.ready = this.ready.bind(this);
    this.setupMiddleware = this.setupMiddleware.bind(this);
    this.render = this.render.bind(this);
    this.renderError = this.renderError.bind(this);
    this.requireMiddleware = this.requireMiddleware.bind(this);
    this.useMiddleware = this.useMiddleware.bind(this);
    this.listen = this.listen.bind(this);

    if (options.dev) {
      // devMiddleware placeholder
      leafage.hook('server:devMiddleware', (devMiddleware) => {
        this.devMiddleware = devMiddleware;
      });
      // disable etag
      this.app.set('etag', false);
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
        res.set('X-Powered-By', `${pkg.name}/${pkg.version}`);

        next();
      }];

    if (dev) {
      // devMiddleware
      middlewares.push((req, res, next) => {
        const { devMiddleware } = this;
        if (devMiddleware) return devMiddleware(req, res, next);

        return next();
      });
    } else if (!builder?.publicPath?.startsWith?.('http')) {
      // client static
      middlewares.push({
        route: `${builder.publicPath}${dir.static}`,
        handle: express.static(path.join(dir.root, dir.dist, dir.static)),
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
    const { name, params, styles, scripts } = renderer.matchResources(req.path);
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

      // set params
      req.params = params || {};
      const ctx = { req, res };
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
    const viewName = '_error';
    const { styles, scripts } = renderer.getResources(viewName);

    try {
      const { Document, App, Component, getServerSideProps } = renderer.requireComponentConfig(viewName);

      const ctx = { req, res, err };
      const assets = { name: viewName, styles, scripts, Document, App, Component };
      const context = createContext({ ctx, assets, renderer });

      if (!isFunction(getServerSideProps)) {
        return context.render(null);
      }

      return getServerSideProps(context);
    } catch (errInfo) {
      return next(errInfo);
    }
  }

  requireMiddleware(entry) {
    const { utils } = this;

    return (...args) => {
      const entryPath = utils.resolveModule(entry);
      const middleware = utils.require(entryPath);
      return middleware(...args);
    };
  }

  useMiddleware(middleware) {
    const { app, useMiddleware, requireMiddleware } = this;

    // middleware path
    if (typeof middleware === 'string') {
      return useMiddleware(requireMiddleware(middleware));
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
