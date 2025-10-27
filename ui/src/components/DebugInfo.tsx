import React from 'react';
import { useParty, useStreamQueries } from '@daml/react';
import { Container, Paper, Typography, Box } from '@mui/material';
import { StablecoinHolding } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';

const DebugInfo: React.FC = () => {
  const party = useParty();
  const { contracts: allStablecoins, loading: loadingStablecoins } = useStreamQueries(StablecoinHolding);

  console.log('=== DEBUG INFO ===');
  console.log('Current party:', party);
  console.log('Loading stablecoins:', loadingStablecoins);
  console.log('Stablecoin contracts found:', allStablecoins.length);
  console.log('All stablecoins:', allStablecoins);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Debug Information
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">
            <strong>Current Party:</strong> {party}
          </Typography>
          
          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>Loading Stablecoins:</strong> {loadingStablecoins ? 'Yes' : 'No'}
          </Typography>
          
          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>Stablecoin Contracts Found:</strong> {allStablecoins.length}
          </Typography>
          
          {allStablecoins.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Contracts:</Typography>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '10px', 
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {JSON.stringify(allStablecoins, null, 2)}
              </pre>
            </Box>
          )}
          
          {!loadingStablecoins && allStablecoins.length === 0 && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff3cd' }}>
              <Typography variant="body1" color="error">
                ⚠️ No contracts found! This means either:
              </Typography>
              <ul>
                <li>The Init script didn't run or failed</li>
                <li>The party ID is incorrect</li>
                <li>The contracts were created for different parties</li>
              </ul>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Next steps:</strong>
              </Typography>
              <ol>
                <li>Check Navigator at http://localhost:7500</li>
                <li>Verify party IDs match in parties.ts</li>
                <li>Check terminal running 'daml start' for errors</li>
                <li>Try restarting with ./stop.sh then ./start.sh</li>
              </ol>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default DebugInfo;