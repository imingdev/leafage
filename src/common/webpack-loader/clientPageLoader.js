import { sep } from 'path';
import { EOL } from 'os';

const schema = {
  type: 'object',
  properties: {
    app: {
      description: 'The app load path',
      type: 'string',
    },
    id: {
      description: 'Customize the document node ID',
      type: 'string',
    },
    context: {
      description: 'Name of global water flood object',
      type: 'string',
    },
    css: {
      description: 'The css load path',
      type: 'array',
    },
  },
  additionalProperties: false,
};

const normalizePath = (_path) => {
  if (_path.includes(sep)) return _path.split(sep).join('/');
  return _path.replace(/\/\//g, '/');
};

export default function clientPageLoader() {
  const { resourcePath, getOptions } = this;
  const options = getOptions(schema);

  const { app, id, context, css } = options;

  const appPath = normalizePath(app);
  const componentPath = normalizePath(resourcePath);

  return `
    import React from 'react';
    import { createRoot } from 'react-dom/client';

    import App from '${appPath}';
    import Component from '${componentPath}';
    ${css.map((row) => `import '${row}';`).join(EOL)}

    const props = ${context};
    const mainEl = document.getElementById('${id}');

    createRoot(mainEl).render(React.createElement(App, { Component, props }));
  `;
}
