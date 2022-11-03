import path from 'path';
import importFresh from 'import-fresh';

export default class Utils {
  #options;

  constructor(options) {
    this.#options = options;

    this.require = this.require.bind(this);
    this.resolveModule = this.resolveModule.bind(this);
  }

  require(moduleId) {
    const { dev } = this.#options;

    if (dev) {
      return importFresh(moduleId);
    }

    // eslint-disable-next-line import/no-dynamic-require
    return require(moduleId);
  }

  resolveModule(_path, paths) {
    const { root } = this.#options.dir;

    return require.resolve(_path, {
      paths: []
        .concat(paths || [])
        .concat([path.join(root, 'node_modules')])
        .concat([root]),
    });
  }
}
