import React from 'react';
import { useQuery, useLedger, useParty } from '@daml/react';
import { Box, Paper, Typography, Card, CardContent, Button } from '@mui/material';
import { StablecoinHolding } from '../../../daml/daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin'

type StablecoinHoldingContract = {
  payload: StablecoinHolding;
  contractId: string;
};

const Dashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  const { contracts: holdings, loading } = useQuery<StablecoinHoldingContract, string, undefined>(StablecoinHolding);

  const totalBalance = holdings.reduce((sum, h) => sum + parseFloat(h.payload.amount), 0);

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 2 }}>
      {/* Total Balance Section */}
      <Paper elevation={3} sx={{ padding: 2 }}>
        <Typography variant="h6">Total Balance</Typography>
        <Typography variant="h4">
          ${totalBalance.toLocaleString()} USD Stablecoin
        </Typography>
      </Paper>

      {/* Active Holdings Section */}
      <Paper elevation={3} sx={{ padding: 2 }}>
        <Typography variant="h6">Active Holdings</Typography>
        <Typography variant="body1">{holdings.length} Wallet Contracts</Typography>
      </Paper>

      {/* Your Holdings Section */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Your Holdings
        </Typography>
        {holdings.length === 0 ? (
          <Typography variant="body1">No holdings yet</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {holdings.map((holding) => (
              <Card key={holding.contractId} sx={{ padding: 2 }}>
                <CardContent>
                  <Typography variant="h6">
                    ${parseFloat(holding.payload.amount).toLocaleString()} {holding.payload.currency}
                  </Typography>
                  <Typography variant="body2">Issuer: {holding.payload.issuer}</Typography>
                  {holding.payload.frozen && (
                    <Typography variant="body2" color="error">
                      ⚠️ Frozen
                    </Typography>
                  )}
                </CardContent>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() =>
                    ledger.exercise(StablecoinHolding.Transfer, holding.contractId, {
                      newOwner: party,
                    })
                  }
                >
                  Transfer
                </Button>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;