const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const http = require('http');

const app = express();
const PORT = 7576; // Different port to avoid conflicts
const TARGET = 'http://localhost:7575';

console.log('===========================================');
console.log('Starting CORS Proxy Server');
console.log('===========================================');
console.log('Proxy Port:', PORT);
console.log('Target:', TARGET);
console.log('===========================================\n');

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Create proxy middleware with detailed logging
const proxy = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  logLevel: 'debug',
  
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
  },
  
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[HTTP Response] ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  },
  
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    console.log(`[WebSocket] Proxying connection to: ${req.url}`);
    console.log(`[WebSocket] Headers:`, req.headers);
  },
  
  onOpen: (proxySocket) => {
    console.log('[WebSocket] Connection opened to target');
  },
  
  onClose: (res, socket, head) => {
    console.log('[WebSocket] Connection closed');
  },
  
  onError: (err, req, res) => {
    console.error('[Proxy Error]:', err.message);
    console.error('[Proxy Error] URL:', req.url);
    console.error('[Proxy Error] Method:', req.method);
    
    if (res && !res.headersSent) {
      res.status(500).json({ 
        error: 'Proxy error', 
        message: err.message,
        url: req.url 
      });
    }
  }
});

// Use proxy for all requests
app.use('/', proxy);

// Create HTTP server
const server = http.createServer(app);

// Handle WebSocket upgrade manually with better error handling
server.on('upgrade', (request, socket, head) => {
  console.log('\n[WebSocket Upgrade] Request received');
  console.log('[WebSocket Upgrade] URL:', request.url);
  console.log('[WebSocket Upgrade] Origin:', request.headers.origin);
  console.log('[WebSocket Upgrade] Protocol:', request.headers['sec-websocket-protocol']);
  
  try {
    proxy.upgrade(request, socket, head);
    console.log('[WebSocket Upgrade] Successfully proxied\n');
  } catch (error) {
    console.error('[WebSocket Upgrade Error]:', error.message);
    socket.end();
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error('[Server Error]:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use!`);
    console.error('Please stop any other processes using this port and try again.');
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log('\n===========================================');
  console.log('✓ CORS Proxy Server Started Successfully!');
  console.log('===========================================');
  console.log(`HTTP Proxy:      http://localhost:${PORT}`);
  console.log(`WebSocket Proxy: ws://localhost:${PORT}`);
  console.log(`Target:          ${TARGET}`);
  console.log('===========================================\n');
  console.log('Waiting for connections...\n');
});