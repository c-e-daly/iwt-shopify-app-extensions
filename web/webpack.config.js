const path = require('path');

module.exports = {
  entry: 'web/routes/index.jsx', // Update the path to point to your correct index.js
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'), // Ensure output is in the correct directory
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Process JavaScript files
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/, // Process CSS files if needed
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    alias: {
      Components: path.resolve(__dirname, 'web/components/'), // Optionally, you can create an alias for components
      Locales: path.resolve(__dirname, 'web/locales/'), // Create an alias for locales if needed
    },
  },
};
