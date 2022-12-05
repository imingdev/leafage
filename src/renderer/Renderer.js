import path from 'path';
import fs from 'fs';
import Utils from 'leafage/dist/common/Utils';
import ReactRender from './ReactRender';

export default class Renderer {
  constructor(leafage) {
    const { options } = leafage;

    this.leafage = leafage;
    this.options = options;
    this.resources = {};
    this.renderer = new ReactRender(options);
    this.cache = new Map();
    this.utils = new Utils(options);

    this.requireComponent = this.requireComponent.bind(this);
    this.requireComponentConfig = this.requireComponentConfig.bind(this);
    this.loadResources = this.loadResources.bind(this);
    this.getResources = this.getResources.bind(this);
    this.render = this.render.bind(this);

    if (!options.dev) {
      this.loadResources(fs);
    }
    // load resources
    leafage.hook('renderer:load-resources', this.loadResources);
  }

  // 加载组件
  requireComponent(name) {
    const { options, cache, utils } = this;
    const { dev, dir } = options;

    const fullPath = path.join(dir.root, dir.dist, dir.server, name);

    if (!dev) {
      // cache
      const cacheOpt = cache.get(fullPath);

      if (cacheOpt) return cacheOpt;
    }

    // normal
    const component = utils.require(fullPath);

    const result = component.default ?? component;

    if (!dev) {
      // prod environment add cache
      cache.set(fullPath, result);
    }

    return result;
  }

  // 加载组件配置
  requireComponentConfig(name) {
    const { requireComponent } = this;

    // Document
    const Document = requireComponent('_document');
    // App
    const App = requireComponent('_app');
    // Component
    const Component = requireComponent(name);

    return {
      Document,
      App,
      Component,
    };
  }

  // 加载资源
  loadResources(_fs) {
    const { root, dist, manifest } = this.options.dir;

    let resources = {};

    try {
      const fullPath = path.join(root, dist, manifest);

      if (_fs.existsSync(fullPath)) {
        const contents = _fs.readFileSync(fullPath, 'utf-8');

        resources = JSON.parse(contents) || {};
      }
    } catch (err) {
      resources = {};
    }

    this.resources = resources;

    return resources;
  }

  // 根据视图名称获取资源
  getResources(viewName) {
    const { resources } = this;

    // eslint-disable-next-line no-underscore-dangle
    return resources[viewName] || resources._error;
  }

  /**
   * 根据视图名渲染
   * @param viewName  视图名称
   * @param props     数据
   */
  render(viewName, props) {
    const { renderer, getResources, requireComponentConfig } = this;

    const { styles, scripts } = getResources(viewName);
    const { Document, App, Component } = requireComponentConfig(viewName);

    const assets = {
      Document,
      App,
      Component,
      styles,
      scripts,
    };
    return renderer.render(assets, props);
  }
}
