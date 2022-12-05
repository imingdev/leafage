import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import { name, dependencies, devDependencies } from './package.json';

const packages = [
  'common/babel-plugin/autoCssModules',
  'common/webpack-loader/clientPageLoader',
  'common/server/Router',
  'common/Utils',
  'builder/Builder',
  'config/config',
  'core/Leafage',
  'pages/App',
  'pages/Document',
  'pages/Error',
  'server/Server',
  'renderer/Renderer',
];

export default packages.map((row) => ({
  input: `./src/${row}`,
  output: {
    file: `./dist/${row}.js`,
    format: 'cjs',
    exports: 'auto',
  },
  plugins: [
    // 支持第三方模块
    resolve({
      extensions: ['.js', '.jsx'],
    }),
    // 支持 commonjs 格式
    commonjs(),
    // babel
    babel({ babelHelpers: 'bundled' }),
    // json
    json(),
  ],
  external: [
    'react-dom/server',
  ]
    .concat(packages.map((r) => `${name}/dist/${r}`))
    .concat(Object.keys(dependencies))
    .concat(Object.keys(devDependencies)),
}));
