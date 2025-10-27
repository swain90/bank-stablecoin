const http = require('http');
const WebSocket = require('ws');

console.log('===========================================');
console.log('Testing Daml JSON API Connections');
console.log('===========================================\n');

// Test 1: HTTP connection to JSON API
console.log('Test 1: HTTP Connection to JSON API (port 7575)');
const httpOptions = {
  hostname: 'localhost',
  port: 7575,
  path: '/v1/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const testData = JSON.stringify({
  templateIds: [],
  query: {}
});

const httpReq = http.request(httpOptions, (res) => {
  console.log(`✓ HTTP Status: ${res.statusCode}`);
  console.log(`✓ HTTP connection working!\n`);
  
  // Test 2: WebSocket connection
  console.log('Test 2: WebSocket Connection to JSON API (port 7575)');
  
  try {
    // Create a minimal valid token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2RhbWwuY29tL2xlZGdlci1hcGkiOnsibGVkZ2VySWQiOiJiYW5rLXN0YWJsZWNvaW4tc2FuZGJveCIsImFwcGxpY2F0aW9uSWQiOiJiYW5rLXN0YWJsZWNvaW4iLCJhY3RBcyI6WyJ0ZXN0Il19fQ.test';
    
    const ws = new WebSocket('ws://localhost:7575/v1/stream/query', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    ws.on('open', () => {
      console.log('✓ WebSocket connection opened!');
      console.log('✓ WebSocket is working!\n');
      ws.close();
      
      console.log('===========================================');
      console.log('✓ All tests passed!');
      console.log('===========================================');
      console.log('\nYou can use direct connection to Daml JSON API.');
      console.log('Update ui/src/config/config.ts to use:');
      console.log('  httpBaseUrl: "http://localhost:7575/"');
      console.log('  wsBaseUrl: "ws://localhost:7575/"');
    });
    
    ws.on('error', (error) => {
      console.log(`✗ WebSocket error: ${error.message}\n`);
      console.log('===========================================');
      console.log('WebSocket Test Failed');
      console.log('===========================================');
      console.log('\nPossible issues:');
      console.log('1. Daml JSON API not running');
      console.log('2. WebSocket support not enabled');
      console.log('3. CORS/authentication issue\n');
      console.log('Try restarting with: ./stop.sh && ./start.sh');
    });
    
    ws.on('close', () => {
      console.log('WebSocket closed');
    });
    
  } catch (error) {
    console.log(`✗ WebSocket test failed: ${error.message}`);
  }
});

httpReq.on('error', (error) => {
  console.log(`✗ HTTP connection failed: ${error.message}\n`);
  console.log('===========================================');
  console.log('HTTP Test Failed');
  console.log('===========================================');
  console.log('\nMake sure:');
  console.log('1. Daml sandbox is running (daml start)');
  console.log('2. JSON API is on port 7575');
  console.log('3. You are in the project root directory\n');
});

httpReq.write(testData);
httpReq.end();