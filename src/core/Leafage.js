import consola from 'consola';
import Hookable from 'hable';
import Builder from 'leafage/dist/builder/Builder';
import Server from 'leafage/dist/server/Server';
import getOptions from 'leafage/dist/config/config';
import Renderer from 'leafage/dist/renderer/Renderer';
import { version } from '../../package.json';

export default class Leafage extends Hookable {
  constructor(opt) {
    super(consola);

    const options = getOptions(opt);
    this.options = options;

    this.renderer = new Renderer(this);
    this.builder = new Builder(this);
    if (options.server) {
      const server = new Server(this);

      this.server = server;
      this.render = server.app;
    }

    this.dev = this.dev.bind(this);
    this.build = this.build.bind(this);
    this.listen = this.listen.bind(this);
    this.renderToString = this.renderToString.bind(this);
  }

  static getWebpackConfig(options) {
    return Builder.getWebpackConfig(getOptions(options));
  }

  static get version() {
    return `v${version}`;
  }

  async dev() {
    const { build, listen, _readyCalled } = this;

    if (_readyCalled) {
      return this;
    }

    // eslint-disable-next-line no-underscore-dangle
    this._readyCalled = true;

    await build();

    await listen();

    return this;
  }

  async build() {
    const { builder } = this;

    if (builder) {
      await builder.build();
    }
  }

  async listen() {
    const { server } = this;

    if (server) {
      await server.ready();
      server.listen();
    }
  }

  renderToString(viewName, props) {
    return this.renderer.render(viewName, props);
  }
}
