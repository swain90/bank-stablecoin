const http = require('http');

// Helper to create base64url encoding
const base64UrlEncode = (str) => {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Generate a test token
const generateToken = (party) => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    'https://daml.com/ledger-api': {
      ledgerId: 'bank-stablecoin-sandbox',
      applicationId: 'bank-stablecoin',
      actAs: [party]
    }
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const encodedSignature = base64UrlEncode('insecure');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

// Test with a fake party
const testParty = 'test-party';
const token = generateToken(testParty);

console.log('========================================');
console.log('Testing JWT Token Generation');
console.log('========================================');
console.log('Party:', testParty);
console.log('Token:', token);
console.log('Token length:', token.length);
console.log('Token parts:', token.split('.').length);
console.log('');

// Test the token with JSON API
const queryData = JSON.stringify({
  templateIds: [],
  query: {}
});

const options = {
  hostname: 'localhost',
  port: 7575,
  path: '/v1/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': queryData.length
  }
};

console.log('Testing token with JSON API...');
const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✓ Token accepted!');
      console.log('Response:', data.substring(0, 200));
    } else if (res.statusCode === 401) {
      console.log('✗ Token rejected (401 Unauthorized)');
      console.log('Error:', data);
    } else {
      console.log('Response:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.log('✗ Connection error:', error.message);
});

req.write(queryData);
req.end();