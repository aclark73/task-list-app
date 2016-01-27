var CopyWebpackPlugin = require('copy-webpack-plugin')
var path = require('path')

module.exports = {
  // This enables access to node methods (like fs to access filesystem)
  target: 'atom',
  context: __dirname + '/app',
  devtool: 'source-map',
  entry: {
    index: './index.js'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist'
  },
  devServer: {
    contentBase: './build',
    historyApiFallback: true,
    hot: true,
    inline: true,
    progress: true
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.css', '.json', '.scss']
  },
  module: {
    loaders: [
      {
        test: /\.js/,
        exclude: /node_modules/,
        loaders: ['react-hot', 'babel-loader']
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        loader: 'file?name=[name].[ext]'
      },
      {
        test: /\.json$/,
        loader: 'json?name=[name].[ext]'
      },
      {
        test: /\.scss$/,
        loaders: ['style', 'css', 'sass']
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: './../prod', to: './../dist' },
      { from: './main.js', to: './../dist/main.js' }
    ])
  ]
}
