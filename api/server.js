// api/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const unitRoutes = require('./routes/unit');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    unitToken: process.env.UNIT_API_TOKEN ? 'configured' : 'missing'
  });
});

// Mount Unit routes
app.use('/api/unit', unitRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Unit API server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Unit API Token: ${process.env.UNIT_API_TOKEN ? '✓ Set' : '✗ Missing'}`);
});