var CopyWebpackPlugin = require('copy-webpack-plugin')
var path = require('path')

module.exports = {
  // This enables access to node methods (like fs to access filesystem)
  target: 'electron-renderer',
  context: __dirname + '/app',
  devtool: 'source-map',
  entry: {
    index: './index.js',
    main: './main.js'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist/app'
  },
  devServer: {
    contentBase: './build',
    historyApiFallback: true,
    hot: true,
    inline: true,
    progress: true
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.json', '.scss']
  },
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /node_modules/,
        use: ['react-hot-loader', 'babel-loader']
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: 'file?name=[name].[ext]'
      },
      {
        test: /\.json$/,
        use: 'json?name=[name].[ext]'
      },
      {
        test: /\.scss$/,
        use: ['style', 'css', 'sass']
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: './../prod.html', to: './../app/index.html' },
      { from: './main.js', to: './../app/main.js' },
      { from: './app.css', to: './../app/app.css' },
      { from: './../package.json', to: './../package.json'}
    ])
  ],
  externals: [
    'desktop-capturer',
    'electron',
    'ipc',
    'ipc-renderer',
    'native-image',
    'remote',
    'web-frame',
    'clipboard',
    'crash-reporter',
    'screen',
    'shell'
  ]
}
