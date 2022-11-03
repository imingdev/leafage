module.exports = {
  // eslint格式化代码
  'src/**/*.{js,jsx}': (filenames) => [`eslint ${filenames.join(' ')}`],
};
