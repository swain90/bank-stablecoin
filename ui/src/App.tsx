import React, { useState } from 'react';
import { DamlLedger } from '@daml/react';
import { Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { config } from './config';

const App: React.FC = () => {
  const [token, setToken] = useState(null);
  const [party, setParty] = useState(null);

  const handleLogin = (loginToken: string, loginParty: string) => {
    setToken(loginToken);
    setParty(loginParty);
  };

  const handleLogout = () => {
    setToken(null);
    setParty(null);
  };
  
  if (!token || !party) {
    return <div>Please log in to access the platform.</div>;
  }
  
  return (
    <div>
      <header>
        <h1>Bank Stablecoin Platform</h1>
        <div>
          <span>Welcome, {party}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
    </div>
  );

export default App;