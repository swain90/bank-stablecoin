// ui/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.SERVER_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create or get Unit customer
app.post('/api/unit/get-or-create-customer', async (req, res) => {
  const { partyId } = req.body;

  if (!partyId) {
    return res.status(400).json({ error: 'partyId is required' });
  }

  try {
    const response = await fetch('https://api.s.unit.sh/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${process.env.UNIT_API_TOKEN}`
      },
      body: JSON.stringify({
        data: {
          type: 'individualCustomer',
          attributes: {
            fullName: {
              first: partyId.split('::')[0] || 'User',
              last: 'Demo'
            },
            email: `${partyId.replace(/[^a-zA-Z0-9]/g, '')}@demo.example.com`,
            phone: {
              countryCode: '1',
              number: '5555550100'
            },
            address: {
              street: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              postalCode: '94103',
              country: 'US'
            },
            dateOfBirth: '1990-01-01',
            ssn: '000000001',
            tags: {
              partyId: partyId
            }
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Unit API error:', error);
      throw new Error(error.errors?.[0]?.detail || 'Failed to create customer');
    }

    const data = await response.json();

    return res.json({
      success: true,
      customerId: data.data.id,
      customer: data.data
    });

  } catch (error) {
    console.error('Customer creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create Unit account
app.post('/api/unit/create-account', async (req, res) => {
  const { customerId, type } = req.body;

  if (!customerId || !type) {
    return res.status(400).json({ error: 'customerId and type are required' });
  }

  try {
    const depositProduct = type.toLowerCase();

    const response = await fetch('https://api.s.unit.sh/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${process.env.UNIT_API_TOKEN}`
      },
      body: JSON.stringify({
        data: {
          type: 'depositAccount',
          attributes: {
            depositProduct: depositProduct,
            tags: {
              accountType: type,
              createdAt: new Date().toISOString()
            }
          },
          relationships: {
            customer: {
              data: {
                type: 'customer',
                id: customerId
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Unit API error:', error);
      throw new Error(error.errors?.[0]?.detail || 'Failed to create account');
    }

    const data = await response.json();
    const account = data.data;
    const attributes = account.attributes;

    return res.json({
      success: true,
      id: account.id,
      type: account.type,
      attributes: {
        accountNumber: attributes.accountNumber,
        routingNumber: attributes.routingNumber,
        balance: attributes.balance || 0,
        status: attributes.status,
        currency: attributes.currency || 'USD'
      }
    });

  } catch (error) {
    console.error('Account creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Unit API server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});