import { sep } from 'path';
import { EOL } from 'os';

const normalizePath = (_path) => {
  if (_path.includes(sep)) return _path.split(sep).join('/');
  return _path.replace(/\/\//g, '/');
};

export default function clientPageLoader() {
  const { cacheable, resourcePath, getOptions } = this;
  const { dev, getAppPath, id, context, external } = getOptions();

  cacheable(!dev);
  const appPath = normalizePath(getAppPath());
  const componentPath = normalizePath(resourcePath);

  return `
    import React from 'react';
    import { createRoot } from 'react-dom/client';

    import App from '${appPath}';
    import Component from '${componentPath}';
    ${external.map((row) => `import '${row}';`).join(EOL)}

    const props = ${context};
    const mainEl = document.getElementById('${id}');

    createRoot(mainEl).render(React.createElement(App, { Component, props }));
  `;
}
