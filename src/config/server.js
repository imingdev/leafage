export default {
  // host
  host: process.env.HOST || process.env.npm_config_host || 'localhost',
  // 端口
  port: process.env.PORT || process.env.npm_config_port || 7002,
  // 中间件
  middleware: [],
  // 设置中间件
  setupMiddleware: (middleware) => middleware,
};
