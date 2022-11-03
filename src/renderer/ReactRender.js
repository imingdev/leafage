import React from 'react';
import ReactDomServer from 'react-dom/server';
import { Helmet } from 'react-helmet';

export default class ReactRender {
  constructor(options) {
    this.options = options;

    this.createElement = this.createElement.bind(this);
    this.renderToString = this.renderToString.bind(this);
    this.renderToStaticMarkup = this.renderToStaticMarkup.bind(this);
    this.renderToStaticMarkup = this.renderToStaticMarkup.bind(this);
  }

  // eslint-disable-next-line class-methods-use-this
  createElement(component, props) {
    return React.createElement(component, props);
  }

  renderToString(component, props) {
    const { createElement } = this;

    return ReactDomServer.renderToString(createElement(component, props));
  }

  renderToStaticMarkup(component, props) {
    const { createElement } = this;

    return ReactDomServer.renderToStaticMarkup(createElement(component, props));
  }

  render(assets, props) {
    const { renderToString, renderToStaticMarkup, options } = this;
    const { globals } = options;
    const { Document, App, Component, styles, scripts } = assets;

    // render body
    const body = renderToString(App, {
      props,
      Component,
    });

    // helmet
    const helmet = Helmet.renderStatic();

    // render content
    const content = renderToStaticMarkup(Document, {
      body,
      scripts,
      styles,
      props,
      helmet,
      context: globals.context,
      id: globals.id,
    });

    return `<!doctype html>${content}`;
  }
}
