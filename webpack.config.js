const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, options) => {
  console.log(options);
  const plugins = [
    new CleanWebpackPlugin(),
  ];
  if (options.mode !== 'production') {
    plugins.push(
      new HtmlWebpackPlugin({
        title: 'Output Management',
        template: path.resolve(__dirname, "./", "index.html"),
      }),
    );
  } else {
    plugins.push(
      new webpack.ProvidePlugin({
        _: "lodash",
      })
    );
    plugins.push(
      new HtmlWebpackPlugin({
        filename: '../../views/index.ejs',
        title: 'Output Management',
        template: path.resolve(__dirname, "./", "index.html"),
      }),
    );
  }
  return {
    entry: {
      frontend: './src/app.js',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          exclude: '/node_modules/',
        },
        {
          test: /\.s[ac]ss$/i,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
        {
          test: /\.ejs$/,
          loader: 'ejs-loader',
          options: {
            variable: 'data',
            interpolate : '\\{\\{(.+?)\\}\\}',
            evaluate : '\\[\\[(.+?)\\]\\]'
          }
        },
        {
          test: /\.less$/i,
          use: ["style-loader", "css-loader", "less-loader"],
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        // IMAGES
        {
          test: /\.(jpe?g|png|gif)$/,
          loader: 'file-loader',
          options: {
              name: 'images/[name].[ext]',
          },
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    plugins: plugins,
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, options.mode !== 'production' ? 'dist' : 'public/javascripts'),
      publicPath: options.mode !== 'production' ? undefined : '/javascripts',
    },
    devServer: {
      proxy: {
        '/commit_range_data': 'http://localhost:3000',
        '/class_overview': 'http://localhost:3000',
        '/call_volume': 'http://localhost:3000',
      }
    }
  };
};
