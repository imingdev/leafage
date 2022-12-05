import path from 'path';
import express from 'express';
import consola from 'consola';
import hmr from 'node-hmr';
import Utils from 'leafage/dist/common/Utils';
import errorHandle from './utils/errorHandle';
import pkg from '../../package.json';

export default class Server {
  constructor(leafage) {
    const { options, renderer } = leafage;
    const { dir } = options;

    this.leafage = leafage;
    this.renderer = renderer;
    this.options = options;
    this.utils = new Utils(options);

    this.ready = this.ready.bind(this);
    this.setupMiddleware = this.setupMiddleware.bind(this);
    this.setupRouter = this.setupRouter.bind(this);
    this.render = this.render.bind(this);
    this.renderError = this.renderError.bind(this);
    this.requireMiddleware = this.requireMiddleware.bind(this);
    this.useMiddleware = this.useMiddleware.bind(this);
    this.listen = this.listen.bind(this);

    // 关闭版权并解决代理时取不到ip地址
    this.app = express()
      // 关闭版权
      .disable('x-powered-by')
      // 解决代理时取不到ip地址
      .set('trust proxy', 'loopback')
      // 设置模板引擎
      .engine('js', this.render)
      .set('views', path.join(dir.root, dir.dist, dir.server))
      .set('view engine', 'js');

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
    const { setupMiddleware, setupRouter } = this;

    // Setup middleware
    await setupMiddleware();

    // Setup router
    await setupRouter();
  }

  setupMiddleware() {
    const { options, utils, useMiddleware } = this;
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
  }

  setupRouter() {
    const { app, options, renderError, useMiddleware, requireMiddleware } = this;

    const viewName = '_router.js';
    const basePath = app.get('views');
    const fullPath = path.join(basePath, viewName);
    let router = requireMiddleware(fullPath);

    if (options.dev) {
      // hmr
      hmr(() => { router = requireMiddleware(fullPath); }, { watchDir: basePath, watchFilePatterns: [viewName] });
      // Finally use router
      useMiddleware((req, res, next) => router(req, res, next));
    } else {
      // Finally use router
      useMiddleware(router);
    }

    // Error use router
    useMiddleware(renderError);
  }

  /**
   * 渲染
   * @param filePath  文件路径
   * @param props     数据
   * @param callback  回调
   */
  render(filePath, props, callback) {
    const { renderer } = this;
    const { app } = this;

    const getViewName = (_path) => {
      const basePath = app.get('views');
      const ext = app.get('view engine').replace(/^\./, '');

      return _path
        .replace(basePath, '')
        .replace(new RegExp(`.${ext}$`), '')
        .replace(/\\/g, '/')
        .split('/')
        .filter(Boolean)
        .join('/');
    };

    try {
      // eslint-disable-next-line no-param-reassign
      delete props.settings;
      // eslint-disable-next-line no-param-reassign,no-underscore-dangle
      delete props._locals;
      // eslint-disable-next-line no-param-reassign
      delete props.cache;

      const viewName = getViewName(filePath);
      const html = renderer.render(viewName, props);

      return callback(null, html);
    } catch (err) {
      return callback(err);
    }
  }

  renderError(err, req, res, next) {
    const { renderer } = this;

    try {
      const { statusCode, message } = errorHandle(err, req, res);
      const html = renderer.render('_error', { statusCode, message });

      return res.send(html);
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
