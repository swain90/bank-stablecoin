// Ledger configuration
export const config = {
  ledgerId: 'sandbox',
  httpBaseUrl: 'http://localhost:7576/',
  wsBaseUrl: 'ws://localhost:7576/',
};

console.log('Config loaded:', config);
  
  // Party IDs (updated after ledger setup)
  export const parties = {
    bank: 'Bank::122...',
    alice: 'Alice::122...',
    bob: 'Bob::122...',
  };