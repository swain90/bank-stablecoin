const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Disable the built-in proxy since we're using external CORS proxy
  console.log('Built-in proxy disabled - using external CORS proxy on port 7576');
};