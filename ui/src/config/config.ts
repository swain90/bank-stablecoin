// Ledger configuration
export const config = {
  ledgerId: 'sandbox',
  httpBaseUrl: 'http://localhost:7576/',
  wsBaseUrl: 'ws://localhost:7576/',
};

// export const config = {
//   httpBaseUrl: 'http://localhost:3001/',
//   wsBaseUrl: 'ws://localhost:3001/',  // Use proxy port (same as HTTP)
//   ledgerId: 'sandbox',
// };

console.log('Config loaded:', config);
  
  // Party IDs (updated after ledger setup)
  export const parties = {
    bank: 'Bank::122...',
    alice: 'Alice::122...',
    bob: 'Bob::122...',
  };