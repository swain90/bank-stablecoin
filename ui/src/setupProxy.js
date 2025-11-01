const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('========================================');
  console.log('Setting up proxy middleware...');
  console.log('========================================');
  
  // Proxy Unit.co API calls to our Express server (port 3002)
  const unitProxy = createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      console.log('[Unit API Proxy] →', req.method, req.path);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('[Unit API Proxy] ←', proxyRes.statusCode, req.method, req.path);
    },
    onError: (err, req, res) => {
      console.error('[Unit API Proxy ERROR]:', err.message);
      console.error('[Unit API Proxy ERROR] Path:', req.path);
    }
  });
  
  app.use('/api/unit', unitProxy);
  
  console.log('✓ Unit API proxy configured');
  console.log('  Route: /api/unit/* → http://localhost:3002/api/unit/*');
  console.log('========================================');
  console.log('Note: Canton/Daml proxy handled by external CORS proxy on port 7576');
  console.log('========================================\n');
};