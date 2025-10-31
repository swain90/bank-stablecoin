import React, { useState } from 'react';
import DamlLedger from '@daml/react';
import { Container, AppBar, Toolbar, Typography, Button, Box, Tabs, Tab } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './components/Dashboard';
import TransferProposals from './components/TransferProposals';
import TransactionHistory from './components/TransactionHistory';
import Login from './components/Login';
import { getDisplayName } from './config/parties';
import { config } from './config/config';
import IssuanceRedemption from './components/IssuanceRedemption';
import BankAdmin from './components/BankAdmin';
import ComplianceManagement from './components/ComplianceManagement';
import Loans from './components/Loans';
import AtomicSwaps from './components/AtomicSwaps';
import MultiSigWallets from './components/MultiSigWallets';
import BlockchainAnalyzer from './components/BlockchainAnalyzer';
import DebugInfo from './components/DebugInfo';
import RealBankingDashboard from './components/RealBankingDashboard';

console.log('Using HTTP URL:', config.httpBaseUrl);
console.log('Using WebSocket URL:', config.wsBaseUrl);
console.log('Ledger ID:', config.ledgerId);

// Helper to convert to base64url (removes padding and makes URL-safe)
const base64UrlEncode = (str: string): string => {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Generate a proper JWT token for Canton with --allow-insecure-tokens
const generateToken = (party: string): string => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    'https://daml.com/ledger-api': {
      ledgerId: config.ledgerId,
      applicationId: 'bank-stablecoin',
      actAs: [party]
    }
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const encodedSignature = base64UrlEncode('insecure');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

const App: React.FC = () => {
  const [party, setParty] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleLogin = (loginParty: string) => {
    setParty(loginParty);
  };

  const handleLogout = () => {
    setParty(null);
    setActiveTab(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!party) {
    return <Login onLogin={handleLogin} />;
  }

  // Try using just the party ID as token - simplest approach for dev
  const token = generateToken(party);
  
  console.log('Connecting with party:', party);
  console.log('Token:', token);

  return (
    <DamlLedger
      token={token}
      party={party}
      httpBaseUrl={config.httpBaseUrl}
      wsBaseUrl={config.wsBaseUrl}
    >
      <ToastContainer />
      <Container maxWidth={false} disableGutters>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Bank Stablecoin Platform
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Welcome, {getDisplayName(party)}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </Box>
          </Toolbar>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            centered
          >
            <Tab label="Dashboard" />
            <Tab label="Transfer Proposals" />
            <Tab label="Transaction History" />
            <Tab label="Issuance & Redemption" />
            <Tab label="Loans" />
            <Tab label="Atomic Swaps" />
            <Tab label="Multi-Sig Wallets" />
            <Tab label="Bank Admin" />
            <Tab label="Compliance" />
            <Tab label="Ledger Analyzer" />
            <Tab label="Debug" />
            <Tab label="Real Banking Dashboard" />

          </Tabs>
        </AppBar>
        {activeTab === 0 && <Dashboard />}
        {activeTab === 1 && <TransferProposals />}
        {activeTab === 2 && <TransactionHistory />}
        {activeTab === 3 && <IssuanceRedemption />}
        {activeTab === 4 && <Loans />}
        {activeTab === 5 && <AtomicSwaps />}
        {activeTab === 6 && <MultiSigWallets />}
        {activeTab === 7 && <BankAdmin />}
        {activeTab === 8 && <ComplianceManagement />}
        {activeTab === 9 && <BlockchainAnalyzer />}
        {activeTab === 10 && <DebugInfo />}
        {activeTab === 11 && <RealBankingDashboard />}
      </Container>
    </DamlLedger>
  );
};

export default App;