// builder配置
export default {
  // 访问根路径
  publicPath: '/',
  // webpack扩展配置
  // config, {isDev, isClient, isServer}
  extend: (config) => config,
  // 文件名
  filenames: {
    // { isDev, isClient, isServer }
    app: ({ isDev }) => (isDev ? '[name].js' : 'js/[contenthash:8].js'),
    chunk: ({ isDev }) => (isDev ? '[name].js' : 'js/[contenthash:8].js'),
    css: ({ isDev }) => (isDev ? '[name].css' : 'css/[contenthash:8].css'),
    image: ({ isDev }) => (isDev ? '[path][name][ext]' : 'images/[contenthash:8][ext]'),
    font: ({ isDev }) => (isDev ? '[path][name][ext]' : 'fonts/[contenthash:8][ext]'),
    video: ({ isDev }) => (isDev ? '[path][name][ext]' : 'videos/[contenthash:8][ext]'),
    cssModules: ({ isDev }) => (isDev ? '[name]__[local]--[hash:base64:5]' : '_[hash:base64:10]'),
  },
  // webpack watch配置
  watch: {},
  // babel配置,和babel.config.js配置一致
  babel: {},
};
