import React, { useState } from 'react';
import DamlLedger from '@daml/react';
import { Container, AppBar, Toolbar, Typography, Button, Box, Tabs, Tab } from '@mui/material';
import Dashboard from './components/Dashboard';
import TransferProposals from './components/TransferProposals';
import Login from './components/Login';

const config = {
  ledgerUrl: 'http://localhost:3001/',
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

// const generateToken = () => {
//   const header = { alg: 'HS256', typ: 'JWT' };
//   const payload = {
//     'https://daml.com/ledger-api': {
//       ledgerId: 'sandbox',
//       applicationId: 'bank-stablecoin',
//       actAs: [
//         "party-ffa8241f-c6e8-4d1b-9e4b-c3a41f607651::1220858cd0601148528d75ab0534ffda02c0d57c3234e96a2e8d494783807122f3e1", // Alice (sender)
//         "party-7e52f38b-f38b-4b80-b80b-dee4d179cded::1220858cd0601148528d75ab0534ffda02c0d57c3234e96a2e8d494783807122f3e1"  // Bob (receiver)
//       ]
//     },
//   };

//   const base64UrlEncode = (obj: object) =>
//     btoa(JSON.stringify(obj))
//       .replace(/=/g, '')
//       .replace(/\+/g, '-')
//       .replace(/\//g, '_');

//   const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;
//   const signature = 'dummy-signature'; // Replace with a real signature in production
//   return `${unsignedToken}.${signature}`;
// };



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

  // const token = generateToken(party ? [party] : []);

  const token = generateToken(party);

  console.log("Generated Token:", token); // Log the token
console.log("Party:", party);

  return (
    <DamlLedger
      token={token}
      party={party}
      httpBaseUrl={config.ledgerUrl}
      reconnectThreshold={0}
    >
      <Container maxWidth={false} disableGutters>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Bank Stablecoin Platform
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Welcome, {party.split('::')[0]}
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
          </Tabs>
        </AppBar>
        {activeTab === 0 && <Dashboard />}
        {activeTab === 1 && <TransferProposals />}
      </Container>
    </DamlLedger>
  );
};

export default App;