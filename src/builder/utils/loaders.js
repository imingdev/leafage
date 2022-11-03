import MiniCssExtractPlugin from 'mini-css-extract-plugin';

// css loader
export const cssLoaders = (opt) => {
  const cssLoader = {
    loader: 'css-loader',
    options: {
      modules: {
        auto: opt.useCssModules ? undefined : /\.module\.\w+$/i,
        localIdentName: opt.assetsPath.cssModules,
      },
      sourceMap: opt.sourceMap,
    },
  };

  const postcssLoader = 'postcss-loader';

  // generate loader string to be used with extract text plugin
  const generateLoaders = (loader, loaderOptions) => {
    const loaders = [cssLoader, postcssLoader];

    if (loader) {
      loaders.push({
        loader: `${loader}-loader`,
        options: {
          ...loaderOptions,
          sourceMap: opt.sourceMap,
        },
      });
    }

    if (opt.extract) {
      return [MiniCssExtractPlugin.loader].concat(loaders);
    }
    return loaders;
  };

  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    less: generateLoaders('less'),
    sass: generateLoaders('sass', { indentedSyntax: true }),
    scss: generateLoaders('sass'),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus'),
  };
};

export const styleLoaders = (options = {}) => {
  const output = [];
  const normalLoaders = cssLoaders(options);
  const cssModulesLoaders = cssLoaders({ ...options, useCssModules: true });

  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const extension in normalLoaders) {
    const test = new RegExp(`\\.${extension}$`);
    output.push({
      oneOf: [{
        test,
        resourceQuery: /modules/,
        use: cssModulesLoaders[extension],
      }, {
        test,
        use: normalLoaders[extension],
      }],
    });
  }

  return output;
};

// asset loader
export const assetsLoaders = ({ emitFile = true, assetsPath } = {}) => {
  const maxSize = 1000;

  return [{
    test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
    type: 'asset',
    generator: {
      filename: assetsPath.image,
      emit: emitFile,
    },
    parser: {
      dataUrlCondition: {
        maxSize,
      },
    },
  }, {
    test: /\.(webm|mp4|ogv)$/i,
    type: 'asset',
    generator: {
      filename: assetsPath.video,
      emit: emitFile,
    },
    parser: {
      dataUrlCondition: {
        maxSize,
      },
    },
  }, {
    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
    type: 'asset',
    generator: {
      filename: assetsPath.font,
      emit: emitFile,
    },
    parser: {
      dataUrlCondition: {
        maxSize,
      },
    },
  }];
};
