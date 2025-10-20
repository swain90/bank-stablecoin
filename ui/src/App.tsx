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

const config = {
  ledgerUrl: 'http://localhost:7575/',
};

// Simple token generation for local development
// In production, you'd get this from a proper auth server
const generateToken = (party: string) => {
  // For Canton/Daml 2.x, we need a proper JWT structure
  // This creates a base64 encoded token with the party info
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    'https://daml.com/ledger-api': {
      ledgerId: 'sandbox',
      applicationId: 'bank-stablecoin',
      actAs: [party],
    },
  };
  
  // Base64 URL encoding (removes padding and makes URL-safe)
  const base64UrlEncode = (str: string) => {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');  // Remove padding
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  // For local development without validation
  return `${encodedHeader}.${encodedPayload}.dev`;
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
            <Tab label="Bank Admin" />  {/* ADD THIS LINE */}
          </Tabs>
        </AppBar>
        {activeTab === 0 && <Dashboard />}
        {activeTab === 1 && <TransferProposals />}
        {activeTab === 2 && <TransactionHistory />}
        {activeTab === 3 && <IssuanceRedemption />}
        {activeTab === 4 && <BankAdmin />}  {/* ADD THIS LINE */}
      </Container>
    </DamlLedger>
  );
};

export default App;