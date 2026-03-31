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
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://cantonbankingplatform.com'],
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

// --- Dynamic parties endpoint ---
// Returns current party IDs from the running Daml ledger.
// This solves the problem of stale party IDs after ledger restarts.
app.get('/api/parties', (req, res) => {
  const { exec } = require('child_process');
  exec('daml ledger list-parties --host localhost --port 6865', { timeout: 10000 }, (err, stdout) => {
    if (err) {
      console.error('[Parties] Failed to fetch:', err.message);
      return res.status(500).json({ error: 'Failed to fetch parties from ledger' });
    }

    const result = {};
    for (const line of stdout.split('\n')) {
      if (!line.includes('party-')) continue;
      const match = line.match(/(party-[a-f0-9-]+::[a-f0-9]+)/);
      if (!match) continue;
      const partyId = match[1];
      const lower = line.toLowerCase();
      if (lower.includes('alice')) result.alice = { displayName: 'Alice', partyId, role: 'User' };
      else if (lower.includes('bob')) result.bob = { displayName: 'Bob', partyId, role: 'User' };
      else if (lower.includes('bank')) result.bank = { displayName: 'Bank', partyId, role: 'Issuer' };
    }

    if (!result.alice || !result.bob || !result.bank) {
      console.error('[Parties] Could not find all parties:', result);
      return res.status(500).json({ error: 'Incomplete party list', found: result });
    }

    console.log('[Parties] Returning current party IDs');
    res.json(result);
  });
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