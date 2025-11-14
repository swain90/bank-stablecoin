const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  // Add webpack fallbacks for node modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    url: require.resolve('url'),
    assert: require.resolve('assert'),
  };
  
  // Add webpack aliases for DAML packages
  config.resolve.alias = {
    ...config.resolve.alias,
    '@daml.js/40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7': path.resolve(__dirname, 'src/daml.js/40f452260bef3f29dede136108fc08a88d5a5250310281067087da6f0baddff7'),
    '@daml.js/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662': path.resolve(__dirname, 'src/daml.js/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662'),
  };
  
  // Add Buffer and process plugins
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ];
  
  // Ignore source map warnings from node_modules
  config.ignoreWarnings = [/Failed to parse source map/];
  
  return config;
};