const http = require('http');

console.log('Testing basic JSON API connection...\n');

// Test without authentication to check if service is running
const options = {
  hostname: 'localhost',
  port: 7575,
  path: '/livez',  // Health check endpoint
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    console.log('✓ JSON API is running and healthy!\n');
    console.log('The 401 error means authentication is required.');
    console.log('Update daml.yaml to disable auth for development.\n');
  } else {
    console.log('✗ Unexpected status code\n');
  }
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data) console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.log(`✗ Connection failed: ${error.message}`);
  console.log('Make sure daml start is running!');
});

req.end();