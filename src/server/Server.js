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
    const { options, utils, render, renderError, useMiddleware } = this;
    const { dev, builder, dir, server } = options;

    // add Powered-By
    useMiddleware((req, res, next) => {
      res.set('X-Powered-By', `${pkg.name}/${pkg.version}`);

      next();
    });

    // 解析json数据
    useMiddleware(express.json());
    // 解析 application/x-www-form-urlencoded
    useMiddleware(express.urlencoded({ extended: false }));

    // static assets
    if (server.static) {
      const staticCfg = Array.isArray(server.static) ? server.static : [server.static];
      staticCfg.forEach((row) => {
        if (typeof row === 'string') {
          useMiddleware({
            route: `${row}`,
            handle: express.static(utils.resolveModule(row)),
          });
        } else if (typeof row === 'object') {
          const { publicPath, directory, ...staticArgs } = row;
          useMiddleware({
            route: `${publicPath}`,
            handle: express.static(directory, staticArgs),
          });
        }
      });
    }

    if (dev) {
      // devMiddleware
      useMiddleware((req, res, next) => {
        const { devMiddleware } = this;
        if (devMiddleware) return devMiddleware(req, res, next);

        return next();
      });
    } else if (!builder?.publicPath?.startsWith?.('http')) {
      // client static
      useMiddleware({
        route: `${builder.publicPath}${dir.static}`,
        handle: express.static(path.join(dir.root, dir.dist, dir.static)),
      });
    }

    // Custom middleware
    useMiddleware(path.join(dir.root, dir.dist, dir.server, '_middleware'));

    // Finally use router
    useMiddleware(render);

    // Error use router
    useMiddleware(renderError);
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
        return context.render();
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
        return context.render();
      }

      return getServerSideProps(context);
    } catch (errInfo) {
      return next(errInfo);
    }
  }

  requireMiddleware(entry) {
    const { utils } = this;

    const entryPath = utils.resolveModule(entry);
    const middlewareFn = utils.require(entryPath);

    return middlewareFn.default ?? middlewareFn;
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
        message: `Server listening on http://localhost:${port}`, badge: true,
      });
    });
  }
}
