import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Paper, MenuItem, FormControl, InputLabel, Select, SelectChangeEvent } from '@mui/material';
import { getAllParties, getPartyByName } from '../config/parties';

interface LoginProps {
  onLogin: (party: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedParty, setSelectedParty] = useState("");
  const [customPartyId, setCustomPartyId] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const partyList = getAllParties();

  const handlePartyChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    if (value === 'custom') {
      setUseCustom(true);
      setSelectedParty('');
    } else {
      setUseCustom(false);
      setSelectedParty(value);
      setCustomPartyId('');
    }
  };

  const handleLogin = () => {
    let partyId = '';
    
    if (useCustom) {
      if (customPartyId.trim() === "") {
        alert("Please enter a party ID.");
        return;
      }
      partyId = customPartyId.trim();
    } else {
      if (selectedParty === "") {
        alert("Please select a party.");
        return;
      }
      const party = getPartyByName(selectedParty);
      if (!party) {
        alert("Invalid party selected.");
        return;
      }
      partyId = party.partyId;
    }
    
    onLogin(partyId);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 450 }}>
        <Typography variant="h4" gutterBottom align="center" color="primary">
          Canton Network Decentralized Banking Platform
        </Typography>
        <Typography variant="h6" gutterBottom align="center" color="textSecondary">
          Login to Your Account
        </Typography>

        <Box sx={{ mt: 3 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Party</InputLabel>
            <Select
              value={useCustom ? 'custom' : selectedParty}
              onChange={handlePartyChange}
              label="Select Party"
            >
              {partyList.map((party) => (
                <MenuItem key={party.displayName.toLowerCase()} value={party.displayName.toLowerCase()}>
                  {party.displayName} ({party.role})
                </MenuItem>
              ))}
              <MenuItem value="custom">
                <em>Use Custom Party ID</em>
              </MenuItem>
            </Select>
          </FormControl>

          {useCustom && (
            <TextField
              fullWidth
              label="Custom Party ID"
              value={customPartyId}
              onChange={(e) => setCustomPartyId(e.target.value)}
              margin="normal"
              placeholder="Enter full party identifier..."
              helperText="Paste the complete party ID from the ledger"
            />
          )}

          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleLogin}
            sx={{ marginTop: 3, padding: 1.5 }}
            size="large"
          >
            Login
          </Button>

          <Typography variant="body2" color="textSecondary" align="center" sx={{ marginTop: 2 }}>
            💡 Tip: Party IDs change when you restart the sandbox
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;