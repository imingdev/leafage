import path from 'path';
import fs from 'fs';
import { match as createRegexpMatch } from 'path-to-regexp';
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
    this.matchResources = this.matchResources.bind(this);
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

    // formatter methods
    let methods = component?.config?.methods || ['get'];
    if (typeof methods === 'string') {
      methods = [methods];
    }
    methods = methods.map((r) => r?.toLowerCase?.());

    const result = {
      Component: component.default ?? component,
      getServerSideProps: component?.getServerSideProps,
      config: {
        methods,
      },
    };

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
    const { Component: Document } = requireComponent('_document');
    // App
    const { Component: App } = requireComponent('_app');
    // Component
    const { Component, getServerSideProps, config } = requireComponent(name);

    return {
      Document,
      App,
      Component,
      getServerSideProps,
      config,
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

  // 根据路径名匹配资源
  matchResources(pathname) {
    const { resources } = this;
    const { _error, ...normalResources } = resources || {};
    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const name in normalResources) {
      const { styles, scripts } = normalResources[name];

      const routerPath = `/${name.replace(/\/?index$/, '').replace(/_/g, ':')}`;
      const matchOptions = {
        decode: decodeURIComponent,
        strict: true,
        end: true,
        sensitive: false,
      };
      const matchReg = createRegexpMatch(routerPath, matchOptions);
      const result = matchReg(pathname);
      if (result) {
        return {
          name,
          params: result?.params || {},
          styles,
          scripts,
        };
      }
    }

    return {
      name: '_error',
      params: {},
      styles: _error.styles,
      scripts: _error.scripts,
    };
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
