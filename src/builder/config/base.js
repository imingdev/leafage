import path from 'path';
import WebpackDynamicEntryPlugin from 'webpack-dynamic-entry-plugin';
import webpack from 'webpack';
import consola from 'consola';
import WebpackBarPlugin from 'webpackbar';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { styleLoaders, assetsLoaders } from '../utils/loaders';

export default class WebpackBaseConfig {
  constructor(options) {
    this.options = options;

    this.output = this.output.bind(this);
    this.nodeEnv = this.nodeEnv.bind(this);
    this.getBabelOptions = this.getBabelOptions.bind(this);
    this.plugins = this.plugins.bind(this);
    this.extendConfig = this.extendConfig.bind(this);
    this.config = this.config.bind(this);
  }

  get assetsPath() {
    const { dev, env, options } = this;
    const { dir } = options;
    const { filenames } = options.builder;

    const resolvePath = (_path) => path.posix.join(dev ? '.' : dir.static, _path);

    const loadFileNamePath = (name) => {
      let fileName;
      if (typeof name === 'string') fileName = resolvePath(name);
      if (typeof name === 'function') fileName = resolvePath(name(env));
      if (fileName && dev) {
        const hash = /\[(chunkhash|contenthash|hash)(?::(\d+))?]/.exec(fileName);
        if (hash) consola.warn(`Notice: Please do not use ${hash[1]} in dev mode to prevent memory leak`);
      }
      return fileName;
    };

    const loadCssModulesName = (name) => {
      let cssName;
      if (typeof name === 'string') cssName = name;
      if (typeof name === 'function') cssName = name(env);

      return cssName;
    };

    return {
      app: loadFileNamePath(filenames?.app) || (dev ? '[name].js' : resolvePath('js/[contenthash:8].js')),
      chunk: loadFileNamePath(filenames?.chunk) || (dev ? '[name].js' : resolvePath('js/[contenthash:8].js')),
      css: loadFileNamePath(filenames?.css) || (dev ? '[name].css' : resolvePath('css/[contenthash:8].css')),
      image: loadFileNamePath(filenames?.image) || (dev ? '[path][name].[ext]' : resolvePath('images/[contenthash:8][ext]')),
      font: loadFileNamePath(filenames?.font) || (dev ? '[path][name].[ext]' : resolvePath('fonts/[contenthash:8][ext]')),
      video: loadFileNamePath(filenames?.video) || (dev ? '[path][name].[ext]' : resolvePath('videos/[contenthash:8][ext]')),
      cssModules: loadCssModulesName(filenames?.cssModules) || (dev ? '[name]__[local]--[hash:base64:5]' : '_[hash:base64:10]'),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  get loadDefaultPages() {
    return {
      _document: 'leafage/dist/pages/Document',
      _app: 'leafage/dist/pages/App',
      _error: 'leafage/dist/pages/Error',
    };
  }

  get color() {
    const { name } = this;
    const colors = {
      client: 'green',
      server: 'orange',
    };

    return colors[name];
  }

  get dev() {
    return this.options.dev;
  }

  get env() {
    return {
      isDev: this.dev,
      isServer: this.isServer,
      isClient: this.isClient,
    };
  }

  get mode() {
    return this.dev ? 'development' : 'production';
  }

  get target() {
    return this.isServer ? 'node' : 'web';
  }

  get devtool() {
    const { dev, isServer } = this;
    if (!dev || isServer) return false;

    return 'eval-cheap-module-source-map';
  }

  get rules() {
    const { dev, env, assetsPath, getBabelOptions, options } = this;
    const babelOptions = getBabelOptions();

    return [{
      test: /\.(jsx?)$/,
      loader: 'babel-loader',
      include: [
        path.join(options.dir.root, options.dir.src),
      ],
      options: babelOptions,
    }]
      .concat(styleLoaders({ emitFile: env.isClient, sourceMap: dev, assetsPath }))
      .concat(assetsLoaders({ emitFile: env.isClient, assetsPath }));
  }

  get alias() {
    const { dir } = this.options;

    const srcDir = path.join(dir.root, dir.src);

    return {
      '@': srcDir,
      page: path.join(srcDir, dir.page),
    };
  }

  output() {
    const { builder, dir } = this.options;
    return {
      path: path.join(dir.root, dir.dist),
      publicPath: builder.publicPath,
    };
  }

  nodeEnv() {
    const env = {
      'process.env.NODE_ENV': JSON.stringify(this.mode),
      'process.mode': JSON.stringify(this.mode),
      'process.dev': this.dev,
    };

    Object.entries(this.options.env).forEach(([key, value]) => {
      const envPrefix = 'process.env.';
      const envKey = envPrefix + key.replace(new RegExp(`^${envPrefix}`), '');
      env[envKey] = ['boolean', 'number'].includes(typeof value) ? value : JSON.stringify(value);
    });

    return env;
  }

  getBabelOptions() {
    const { name: envName, env, options } = this;

    const opt = {
      ...options.builder.babel,
      envName,
      compact: false,
    };

    if (opt.configFile || opt.babelrc) return opt;

    const defaultPlugins = [
      'leafage/dist/common/babel-plugin/autoCssModules',
    ];
    if (env.isDev && env.isClient) {
      defaultPlugins.push(['react-refresh/babel', { skipEnvCheck: true }]);
    }
    if (typeof opt.plugins === 'function') opt.plugins = opt.plugins({ envName, ...env }, defaultPlugins);
    if (!opt.plugins) opt.plugins = defaultPlugins;

    const defaultPreset = [
      ['@babel/preset-env', { modules: false }],
      '@babel/preset-react',
    ];
    if (typeof opt.presets === 'function') opt.presets = opt.presets({ envName, ...env }, defaultPreset);
    if (!opt.presets) opt.presets = defaultPreset;

    return opt;
  }

  plugins() {
    const { name, color, nodeEnv, assetsPath } = this;

    return [
      new MiniCssExtractPlugin({
        filename: assetsPath.css,
        chunkFilename: assetsPath.css,
      }),
      new WebpackDynamicEntryPlugin(),
      new WebpackBarPlugin({
        name,
        color,
      }),
      new webpack.DefinePlugin(nodeEnv()),
    ];
  }

  extendConfig(config) {
    const { options, env } = this;

    return options.builder.extend?.(config, env) || config;
  }

  config() {
    const { name, target, mode, devtool, entry, output, rules, plugins, alias } = this;

    return {
      name,
      target,
      mode,
      devtool,
      entry: entry(),
      output: output(),
      module: {
        rules,
      },
      resolve: {
        extensions: ['.js', '.jsx', '.json'],
        alias,
      },
      plugins: plugins(),
      performance: {
        hints: false,
      },
      stats: 'errors-only',
    };
  }
}
