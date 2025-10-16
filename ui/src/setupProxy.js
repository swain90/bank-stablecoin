const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/v1',
    createProxyMiddleware({
      target: 'http://localhost:7575/v1', // Include /v1 in the target
      changeOrigin: true,
      pathRewrite: {
        '^/v1': '', // Remove /v1 from the request since it's already in the target
      },
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying:', req.method, req.url, '→', proxyReq.path);
      },
    })
  );
};