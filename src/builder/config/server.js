import path from 'path';
import WebpackNodeExternals from 'webpack-node-externals';
import WebpackDynamicEntryPlugin from 'webpack-dynamic-entry-plugin';
import { merge } from 'webpack-merge';
import WebpackBaseConfig from './base';

export default class WebpackServerConfig extends WebpackBaseConfig {
  constructor(options) {
    super(options);
    this.name = 'server';
    this.isServer = true;
    this.isClient = false;

    this.entry = this.entry.bind(this);
    this.output = this.output.bind(this);
    this.nodeEnv = this.nodeEnv.bind(this);
  }

  entry() {
    const { options, loadDefaultPages } = this;
    const { dir } = options;

    return WebpackDynamicEntryPlugin.getEntry({
      pattern: [
        path.join(dir.root, dir.src, dir.page, dir.pattern),
        path.join(dir.root, dir.src, dir.page, '{_document,_app,_error}.{js,jsx}'),
        path.join(dir.root, dir.src, dir.page, '_router.js'),
      ],
      generate: (entry) => {
        // eslint-disable-next-line no-underscore-dangle,no-param-reassign
        if (!entry._document) entry._document = loadDefaultPages._document;
        // eslint-disable-next-line no-underscore-dangle,no-param-reassign
        if (!entry._app) entry._app = loadDefaultPages._app;
        // eslint-disable-next-line no-underscore-dangle,no-param-reassign
        if (!entry._error) entry._error = loadDefaultPages._error;
        // eslint-disable-next-line no-underscore-dangle,no-param-reassign
        if (!entry._router) entry._router = loadDefaultPages._router;

        // eslint-disable-next-line prefer-spread
        return Object.assign.apply(Object, Object.keys(entry)
          .map((name) => {
            const key = `${dir.server}/${name}`.split('/').filter(Boolean).join('/');

            return { [key]: entry[name] };
          }));
      },
    });
  }

  output() {
    const output = super.output();
    return {
      ...output,
      filename: '[name].js',
      chunkFilename: '[name].js',
      libraryTarget: 'commonjs2',
    };
  }

  nodeEnv() {
    return {
      ...super.nodeEnv(),
      'process.browser': false,
      'process.client': false,
      'process.server': true,
    };
  }

  config() {
    const { extendConfig } = this;

    const superConfig = super.config();
    const currentConfig = {
      resolve: {
        extensions: ['.server.js', '.server.jsx', '.js', '.jsx', '.json', '...'],
      },
      externals: WebpackNodeExternals({
        // load non-javascript files with extensions, presumably via loaders
        allowlist: [/\.(?!(?:jsx?|json)$).{1,5}$/i],
      }),
    };

    return extendConfig(merge(superConfig, currentConfig));
  }
}
