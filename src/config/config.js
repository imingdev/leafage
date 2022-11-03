import defaultsDeep from 'lodash/defaultsDeep';
import common from './common';
import builder from './builder';
import server from './server';

const defaultConfig = {
  ...common,
  builder,
  server,
};

export default (opt) => defaultsDeep(opt, defaultConfig);
