const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const options = {
    target: 'http://localhost:7575',
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying request:', req.method, req.url);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
    }
  };

  app.use('/v1', createProxyMiddleware(options));
};