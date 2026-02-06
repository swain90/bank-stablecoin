// Ledger configuration
const normalizeBaseUrl = (value: string): string => {
  if (!value) {
    return value;
  }
  return value.endsWith('/') ? value : `${value}/`;
};

const defaultHttpBaseUrl = 'http://localhost:7576/';
const defaultWsBaseUrl = 'ws://localhost:7576/';

export const config = {
  ledgerId: 'sandbox',
  httpBaseUrl: normalizeBaseUrl(process.env.REACT_APP_HTTP_BASE_URL || defaultHttpBaseUrl),
  wsBaseUrl: normalizeBaseUrl(process.env.REACT_APP_WS_BASE_URL || defaultWsBaseUrl),
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