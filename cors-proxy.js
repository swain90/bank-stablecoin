const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const http = require('http');

const app = express();
const PORT = 7576; // Different port to avoid conflicts

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Create proxy middleware
const proxy = createProxyMiddleware({
  target: 'http://localhost:7575',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying: ${req.method} ${req.url} → http://localhost:7575${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  },
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    console.log(`WebSocket Proxying: ${req.url} → ws://localhost:7575${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (res && !res.headersSent) {
      res.status(500).json({ error: 'Proxy error: ' + err.message });
    }
  },
  onClose: (res, socket, head) => {
    console.log('WebSocket connection closed');
  }
});

// Use proxy for all requests
app.use('/', proxy);

// Create HTTP server
const server = http.createServer(app);

// Handle WebSocket upgrade manually to ensure it works
server.on('upgrade', (request, socket, head) => {
  console.log('WebSocket upgrade request received for:', request.url);
  proxy.upgrade(request, socket, head);
});

server.listen(PORT, () => {
  console.log(`CORS Proxy server running on http://localhost:${PORT}`);
  console.log(`Proxying requests to DAML JSON API at http://localhost:7575`);
  console.log(`WebSocket support enabled`);
});