import path from 'path';
import fs from 'fs';
import MFS from 'memory-fs';
import pify from 'pify';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import consola from 'consola';
import rm from 'rimraf';
import getWebpackConfig from './config';

export default class Builder {
  constructor(leafage) {
    const { options } = leafage;

    this.leafage = leafage;
    this.options = options;
    this.webpackConfig = getWebpackConfig(options);

    // Initialize shared MFS for dev
    this.mfs = options.dev ? new MFS() : fs;

    this.webpackCompile = this.webpackCompile.bind(this);
    this.webpackDev = this.webpackDev.bind(this);
    this.middleware = this.middleware.bind(this);
  }

  static getWebpackConfig(options) {
    return getWebpackConfig(options);
  }

  build() {
    const { options, webpackConfig } = this;
    const { client, server } = webpackConfig;

    // before clear dir
    rm.sync(path.join(options.dir.root, options.dir.dist));

    return Promise.all([client, server].map((c) => this.webpackCompile(webpack(c))));
  }

  async webpackCompile(compiler) {
    const { options, leafage, mfs, webpackDev } = this;
    const { name } = compiler.options;

    if (options.dev && name === 'client') {
      // Load renderer resources after build
      compiler.hooks.done.tap('load-resources', async () => {
        // Reload renderer
        await leafage.callHook('renderer:load-resources', mfs);
      });
    }

    if (options.dev) {
      // Client Build, watch is started by dev-middleware
      if (name === 'client') {
        return new Promise((resolve) => {
          compiler.hooks.done.tap('leafage-dev', () => resolve());

          // eslint-disable-next-line no-promise-executor-return
          return webpackDev(compiler);
        });
      }

      // Server, build and watch for changes
      if (name === 'server') {
        return new Promise((resolve, reject) => {
          compiler.watch(options.builder.watch, (err) => {
            if (err) return reject(err);

            resolve();
          });
        });
      }
    }

    // eslint-disable-next-line no-param-reassign
    compiler.run = pify(compiler.run);
    const stats = await compiler.run();

    if (stats.hasErrors()) {
      const error = new Error('leafage build error');
      error.stack = stats.toString('errors-only');
      throw error;
    }

    if (name === 'client') {
      // Await for renderer to load resources (programmatic, tests and generate)
      await leafage.callHook('renderer:load-resources', mfs);
    }
  }

  async webpackDev(compiler) {
    consola.debug('Creating webpack middleware...');

    const { mfs, options, leafage, middleware } = this;
    // Create webpack dev middleware
    this.devMiddleware = pify(
      webpackDevMiddleware(compiler, {
        stats: false,
        outputFileSystem: mfs,
      }),
    );
    // Create webpack hot middleware
    this.hotMiddleware = pify(
      webpackHotMiddleware(compiler, {
        log: false,
        heartbeat: 10000,
        path: `${options.builder.publicPath}__leafage__/hmr`,
      }),
    );

    // Register devMiddleware on server
    await leafage.callHook('server:devMiddleware', middleware);
  }

  // dev middle
  async middleware(req, res, next) {
    const { devMiddleware, hotMiddleware } = this;
    if (devMiddleware) await devMiddleware(req, res);

    if (hotMiddleware) await hotMiddleware(req, res);

    next();
  }
}
