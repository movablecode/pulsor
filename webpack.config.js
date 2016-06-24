// webpack.config.js
'use strict';

module.exports = {
  devtool: "eval",
  resolve: {
    modulesDirectories: ['src/client'],
    extensions: ['', '.es6', '.js']
  },
  entry: {
    'app': './src/client/app.es6'
  },
  output: {
    path: 'dist/static/js/',
    filename: 'app.js'
  },
  // externals: {
  //   'jquery': '$',
  //   'underscore': '_',
  //   'react': 'React'
  // },
  module: {
    loaders: [
      { test: /\.es6$/, loader: 'babel-loader' }
    ]
  }
};
