import path from 'path';
import glob from 'glob';
import webpack from 'webpack';
import WebpackDynamicEntryPlugin from 'webpack-dynamic-entry-plugin';
import CssMinimizerWebpackPlugin from 'css-minimizer-webpack-plugin';
import TerserWebpackPlugin from 'terser-webpack-plugin';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { merge } from 'webpack-merge';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import WebpackBaseConfig from './base';

export default class WebpackClientConfig extends WebpackBaseConfig {
  constructor(options) {
    super(options);
    this.name = 'client';
    this.isServer = false;
    this.isClient = true;

    this.entry = this.entry.bind(this);
    this.output = this.output.bind(this);
    this.nodeEnv = this.nodeEnv.bind(this);
    this.plugins = this.plugins.bind(this);
    this.optimization = this.optimization.bind(this);
  }

  get rules() {
    const { loadDefaultPages, options } = this;
    const { dir, globals, css } = options;

    const rules = super.rules;

    return rules.concat([{
      test: /\.(jsx?)$/,
      resourceQuery: /useClientPageLoader/,
      use: [{
        loader: 'babel-loader',
      }, {
        loader: 'leafage/dist/common/webpack-loader/clientPageLoader',
        options: {
          css,
          // eslint-disable-next-line no-underscore-dangle
          app: glob.sync(path.join(dir.root, dir.src, dir.page, '_app.{js,jsx}'), { nosort: true })?.[0] || loadDefaultPages._app,
          id: globals.id,
          context: globals.context,
        },
      }],
    }]);
  }

  entry() {
    const { options, dev, loadDefaultPages } = this;
    const { dir, builder } = options;

    return WebpackDynamicEntryPlugin.getEntry({
      pattern: [
        path.join(dir.root, dir.src, dir.page, dir.pattern),
        path.join(dir.root, dir.src, dir.page, '_error.{js,jsx}'),
      ],
      generate: (entry) => {
        // eslint-disable-next-line no-underscore-dangle,no-param-reassign
        if (!entry._error) entry._error = loadDefaultPages._error;

        // eslint-disable-next-line prefer-spread
        return Object.assign.apply(Object, Object.keys(entry)
          .map((name) => {
            const entryVal = [`${entry[name]}?useClientPageLoader`];

            if (dev) {
              entryVal.unshift(
                // https://github.com/glenjamin/webpack-hot-middleware#config
                `webpack-hot-middleware/client?path=${builder.publicPath}__leafage__/hmr`,
              );
            }
            return { [name]: entryVal };
          }));
      },
    });
  }

  output() {
    const { assetsPath } = this;
    const output = super.output();
    return {
      ...output,
      filename: assetsPath.app,
      chunkFilename: assetsPath.chunk,
    };
  }

  nodeEnv() {
    return {
      ...super.nodeEnv(),
      'process.browser': true,
      'process.client': true,
      'process.server': false,
    };
  }

  plugins() {
    const { dev, options, assetsPath } = this;
    const { dir, builder } = options;
    const { publicPath } = builder;

    const plugins = super.plugins();
    plugins.push(
      new MiniCssExtractPlugin({
        filename: assetsPath.css,
        chunkFilename: assetsPath.css,
      }),
      new WebpackManifestPlugin({
        publicPath,
        fileName: path.join(dir.root, dir.dist, dir.manifest),
        // eslint-disable-next-line prefer-spread
        generate: (seed, files, entryPoints) => Object.assign
          .apply(Object, Object.keys(entryPoints)
            .map((name) => {
              const fileList = entryPoints[name].map((file) => `${publicPath}${file}`);

              return {
                [name]: {
                  styles: fileList.filter((row) => /\.css$/.test(row)),
                  scripts: fileList.filter((row) => /\.js$/.test(row) && !/\.hot-update.js$/.test(row)),
                },
              };
            })),
      }),
    );

    if (dev) {
      plugins.push(
        new webpack.HotModuleReplacementPlugin(),
        new ReactRefreshWebpackPlugin({
          overlay: false,
        }),
      );
    }

    return plugins;
  }

  optimization() {
    const { dev, options } = this;
    if (dev) return {};

    return {
      splitChunks: {
        cacheGroups: {
          vendor: {
            name: 'vendor',
            chunks: 'initial',
            test: ({ resource }) => resource && /\.js$/.test(resource) && resource.indexOf(path.join(options.dir.root, 'node_modules')) === 0,
          },
          async: {
            name: 'async',
            chunks: 'async',
            minChunks: 3,
          },
        },
      },
      runtimeChunk: true,
      minimizer: [
        new CssMinimizerWebpackPlugin({
          minimizerOptions: {
            preset: ['default', {
              discardComments: {
                removeAll: true,
              },
            }],
          },
        }),
        new TerserWebpackPlugin({
          extractComments: false,
          terserOptions: {
            output: {
              comments: false,
            },
            compress: {
              drop_debugger: true,
              drop_console: true,
            },
          },
        }),
      ],
    };
  }

  config() {
    const { extendConfig, optimization } = this;

    const superConfig = super.config();
    const currentConfig = {
      optimization: optimization(),
    };

    return extendConfig(merge(superConfig, currentConfig));
  }
}
