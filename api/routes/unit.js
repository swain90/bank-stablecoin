// api/routes/unit.js - TEMPORARY MOCK VERSION
const express = require('express');
const router = express.Router();

// Mock customer database (in-memory for testing)
const mockCustomers = new Map();
const mockAccounts = new Map();

router.post('/get-or-create-customer', async (req, res) => {
  console.log('🔵 /get-or-create-customer endpoint hit (MOCK MODE)');
  const { partyId } = req.body;

  if (!partyId) {
    return res.status(400).json({ error: 'partyId is required' });
  }

  try {
    // Check if customer exists
    let customerData = mockCustomers.get(partyId);
    
    if (!customerData) {
      // Create mock customer
      const customerId = `mock-cust-${Date.now()}`;
      const accountId = `mock-acct-${Date.now()}`;
      
      customerData = {
        customerId,
        accountId,
        accountNumber: `${Math.floor(Math.random() * 1000000000)}`,
        routingNumber: '011401533',
        balance: 10000, // Start with $10,000
        currency: 'USD',
        status: 'Open'
      };
      
      mockCustomers.set(partyId, customerData);
      mockAccounts.set(accountId, {
        ...customerData,
        partyId,
        type: 'checking'
      });
      
      console.log('✓ Mock customer created:', customerId);
    }

    return res.json({
      success: true,
      ...customerData
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/create-account', async (req, res) => {
  const { customerId, type } = req.body;

  if (!customerId || !type) {
    return res.status(400).json({ error: 'customerId and type are required' });
  }

  const accountId = `mock-acct-${type}-${Date.now()}`;
  const accountData = {
    id: accountId,
    type: 'depositAccount',
    attributes: {
      accountNumber: `${Math.floor(Math.random() * 1000000000)}`,
      routingNumber: '011401533',
      balance: 0,
      status: 'Open',
      currency: 'USD'
    }
  };

  mockAccounts.set(accountId, accountData);

  return res.json({
    success: true,
    ...accountData
  });
});

// Get account balance
router.get('/account/:accountId', async (req, res) => {
  const { accountId } = req.params;
  const account = mockAccounts.get(accountId);
  
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  return res.json({
    success: true,
    account
  });
});

module.exports = router;