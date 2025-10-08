import React, { useState } from 'react';
import DamlLedger from '@daml/react';
import { Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

const config = {
  ledgerUrl: 'http://localhost:7575',
};

const App: React.FC = () => {
  const [party, setParty] = useState<string | null>(null);

  const handleLogin = (loginParty: string) => {
    setParty(loginParty);
  };

  const handleLogout = () => {
    setParty(null);
  };

  if (!party) {
    return <Login onLogin={handleLogin} />;
  }

  // For development, use party as token
  const token = party;

  return (
    <DamlLedger
      token={token}
      party={party}
      httpBaseUrl={config.ledgerUrl}
    >
      <Container>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Bank Stablecoin Platform
            </Typography>
            <Box>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Welcome, {party}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
        <Dashboard />
      </Container>
    </DamlLedger>
  );
};

export default App;