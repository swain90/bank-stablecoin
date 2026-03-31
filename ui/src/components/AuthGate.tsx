import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Alert } from '@mui/material';

interface AuthGateProps {
  children: React.ReactNode;
}

const DEMO_USERNAME = process.env.REACT_APP_DEMO_USERNAME || 'admin';
const DEMO_PASSWORD = process.env.REACT_APP_DEMO_PASSWORD || 'canton2026';

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Invalid credentials');
    }
  };

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <Dialog open={true} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Canton Banking Platform</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Enter your credentials to access the platform.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="dense"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button type="submit" variant="contained" fullWidth>
            Sign In
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AuthGate;
