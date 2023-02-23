<h1 align="center">@pieced/babel-plugin-auto-css-modules 👋</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/@pieced/babel-plugin-auto-css-modules" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@pieced/babel-plugin-auto-css-modules.svg">
  </a>
  <a href="https://www.npmjs.com/package/@pieced/babel-plugin-auto-css-modules" target="_blank">
    <img alt="Download" src="https://img.shields.io/npm/dm/@pieced/babel-plugin-auto-css-modules.svg?color=blue" target="_blank" />
  </a>
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> Automatically identify CSS Modules

```js
import styles from 'a.scss'; //===>import styles from 'a.scss?modules'
```

## Install

```sh
npm i @pieced/babel-plugin-auto-css-modules
```

## Usage

Without options:

```js
{
  "plugins": [
    "@pieced/babel-plugin-auto-css-modules"
  ]
}
```

With options:

```js
{
  "plugins": [
    [
      "@pieced/babel-plugin-auto-css-modules",
      {
        "generate": "function"
      }
    ]
  ]
}
```
## Options

`generate type function`

```js
(value, suffix) => {
  const CSS_EXT_NAMES = ['.css', '.less', '.sass', '.scss', '.stylus', '.styl'];
  if (CSS_EXT_NAMES.includes(suffix)) return `${value}?modules`;
}
// return import styles from 'a.scss?modules'
```

## 📝 License

Copyright (c) 2021 [mingdev](https://github.com/imingdev).<br />
This project is [MIT](https://github.com/pieced-team/babel-plugin-auto-css-modules/blob/master/LICENSE) licensed.
