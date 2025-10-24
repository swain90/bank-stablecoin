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
import IssuanceRedemption from './components/IssuanceRedemption';
import BankAdmin from './components/BankAdmin';
import ComplianceManagement from './components/ComplianceManagement';
import Loans from './components/Loans';
import AtomicSwaps from './components/AtomicSwaps';
import MultiSigWallets from './components/MultiSigWallets';
import BlockchainAnalyzer from './components/BlockchainAnalyzer';

// Use environment variable or fallback to proxy path
const LEDGER_URL = process.env.REACT_APP_LEDGER_URL || '/v1/';

const config = {
  ledgerUrl: LEDGER_URL,
};

console.log('Using Ledger URL:', config.ledgerUrl);
console.log('Environment REACT_APP_LEDGER_URL:', process.env.REACT_APP_LEDGER_URL);

// Simple token generation for local development
// In production, you'd get this from a proper auth server
const generateToken = (party: string) => {
  // Create a simple token that should work with default DAML settings
  const payload = {
    'https://daml.com/ledger-api': {
      ledgerId: 'sandbox',
      applicationId: 'bank-stablecoin',
      actAs: [party],
    },
  };
  
  // Create a proper JWT structure
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // Use "secret" as signature for development
  return `${encodedHeader}.${encodedPayload}.secret`;
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

  const token = generateToken(party);

  return (
    <DamlLedger
      token={token}
      party={party}
      httpBaseUrl={config.ledgerUrl}
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
      </Container>
    </DamlLedger>
  );
};

export default App;