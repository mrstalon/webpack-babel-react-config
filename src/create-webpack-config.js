const path = require('path');

const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const DotenvWebpack = require('dotenv-webpack');
const dotenv = require('dotenv');

const { isDevelopment } = require('./utils');
const { createBabelConfig } = require('./create-babel-config');

const createWebpackConfig = projectDirname => {
  const fromRoot = (pathTo = '') => path.resolve(projectDirname, pathTo);
  const fromSrc = (pathTo = '') => fromRoot(`src/${pathTo}`);
  const envVars = dotenv.config({
    path: fromRoot('.env'),
  });
  const API_ROOT = envVars && envVars.parsed && envVars.parsed.API_ROOT;

  return {
    entry: fromSrc('index.js'),
    output: {
      path: fromRoot('dist'),
      publicPath: '/',
      filename: 'bundle-[hash:8].js',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: createBabelConfig(),
        },
        {
          test: /\.(bmp|gif|jpe?g|png)$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: '[name].[hash:8].[ext]',
          },
        },
        {
          test: /\.svg$/,
          rules: [
            {
              issuer: /\.js$/,
              loader: 'svg-react-loader',
            },
            {
              issuer: { not: [/\.js$/] },
              use: {
                loader: 'svg-url-loader',
                options: {
                  limit: '4096',
                  name: `[path][name].[ext]${isDevelopment ? '' : '?[hash:7]'}`,
                },
              },
            },
          ],
        },
        {
          test: /\.module\.s(a|c)ss$/,
          loader: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[name]__[local]___[hash:base64:5]',
                },
                sourceMap: isDevelopment,
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: isDevelopment,
              },
            },
          ],
        },
        {
          test: /\.(sa|sc|c)ss$/,
          exclude: /\.module.(s(a|c)ss)$/,
          loader: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                sourceMap: isDevelopment,
              },
            },
          ],
        },
      ],
    },
    resolve: {
      modules: ['node_modules/', 'src/'],
      extensions: ['.js', '.scss'],
    },
    devtool: isDevelopment ? 'cheap-module-eval-source-map' : 'source-map',
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new CopyPlugin([
        {
          from: fromRoot('static'),
          to: fromRoot('dist'),
        },
      ]),
      new HtmlWebpackPlugin({
        template: fromSrc('index.ejs'),
      }),
      new MiniCssExtractPlugin({
        filename: isDevelopment ? '[name].css' : '[name].[hash].css',
        chunkFilename: isDevelopment ? '[id].css' : '[id].[hash].css',
      }),
      new DotenvWebpack(),
    ],
    devServer: {
      hot: true,
      proxy: API_ROOT
        ? {
            '/api': {
              target: API_ROOT,
              changeOrigin: true,
            },
          }
        : null,
      contentBase: fromRoot('dist'),
      historyApiFallback: true,
      publicPath: '/',
      quiet: true,
      open: true,
      overlay: {
        errors: true,
      },
    },
  };
};

module.exports = { createWebpackConfig };
