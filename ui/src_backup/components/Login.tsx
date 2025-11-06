import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Paper } from '@mui/material';

interface LoginProps {
  onLogin: (token: string, party: string) => void; // Updated to accept both parameters
}

const Login: React.FC<{ onLogin: (party: string) => void }> = ({ onLogin }) => {
  const [party, setParty] = useState("");

  const handleLogin = () => {
    if (party.trim() === "") {
      alert("Party ID is required.");
      return;
    }
    onLogin(party);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" gutterBottom align="center">
          Canton Network Banking Platform
        </Typography>
        <Typography variant="h6" gutterBottom align="center">
          Development Login
        </Typography>
        <TextField
          fullWidth
          label="Party ID"
          value={party}
          onChange={(e) => setParty(e.target.value)}
          margin="normal"
          placeholder="Bank, Alice, or Bob"
          required
        />
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleLogin}
          sx={{ marginTop: 2 }}
        >
          Login
        </Button>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ marginTop: 2 }}>
          Development mode: Use party names from your Canton sandbox
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;