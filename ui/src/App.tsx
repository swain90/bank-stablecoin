import React, { useState } from 'react';
import DamlLedger from '@daml/react';
import { Container, AppBar, Toolbar, Typography, Button, Box, Tabs, Tab, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './components/Dashboard';
import TransferProposals from './components/TransferProposals';
import TransactionHistory from './components/TransactionHistory';
import Login from './components/Login';
import { getDisplayName } from './config/parties';
import { config } from './config/config';
import IssuanceRedemption from './components/IssuanceRedemption';
import BankAdmin from './components/BankAdmin';
import ComplianceManagement from './components/ComplianceManagement';
import Loans from './components/Loans';
import AtomicSwaps from './components/AtomicSwaps';
import MultiSigWallets from './components/MultiSigWallets';
import BlockchainAnalyzer from './components/BlockchainAnalyzer';
import DebugInfo from './components/DebugInfo';
import RealBankingDashboard from './components/RealBankingDashboard';
import { WalletProvider } from './contexts/WalletContext';
import MultiChainWallet from './components/MultiChainWallet';
import CrossChainSwap from './components/CrossChainSwap';



console.log('Using HTTP URL:', config.httpBaseUrl);
console.log('Using WebSocket URL:', config.wsBaseUrl);
console.log('Ledger ID:', config.ledgerId);

// Helper to convert to base64url (removes padding and makes URL-safe)
const base64UrlEncode = (str: string): string => {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Generate a proper JWT token for Canton with --allow-insecure-tokens
const generateToken = (party: string): string => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    'https://daml.com/ledger-api': {
      ledgerId: config.ledgerId,
      applicationId: 'bank-stablecoin',
      actAs: [party]
    }
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const encodedSignature = base64UrlEncode('insecure');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

const App: React.FC = () => {

const [bankingAnchor, setBankingAnchor] = useState<null | HTMLElement>(null);
const [advancedAnchor, setAdvancedAnchor] = useState<null | HTMLElement>(null);
const [adminAnchor, setAdminAnchor] = useState<null | HTMLElement>(null);
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

  // Try using just the party ID as token - simplest approach for dev
  const token = generateToken(party);
  
  console.log('Connecting with party:', party);
  console.log('Token:', token);

  

  return (
    <DamlLedger
      token={token}
      party={party}
      httpBaseUrl={config.httpBaseUrl}
      wsBaseUrl={config.wsBaseUrl}
    >
       <WalletProvider>
      <ToastContainer />
      <Container maxWidth={false} disableGutters>
        <AppBar position="static">
        <Toolbar>
  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
    Canton Banking Platform
  </Typography>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    {/* Dashboard - always visible */}
    <Button 
      color="inherit" 
      onClick={() => setActiveTab(0)}
      sx={{ opacity: activeTab === 0 ? 1 : 0.7 }}
    >
      Dashboard
    </Button>

    {/* Banking Dropdown */}
    <Button
      color="inherit"
      onClick={(e) => setBankingAnchor(e.currentTarget)}
      endIcon={<ArrowDropDownIcon />}
    >
      Banking
    </Button>
    <Menu anchorEl={bankingAnchor} open={Boolean(bankingAnchor)} onClose={() => setBankingAnchor(null)}>
      <MenuItem onClick={() => { setActiveTab(1); setBankingAnchor(null); }}>Transfer Proposals</MenuItem>
      <MenuItem onClick={() => { setActiveTab(2); setBankingAnchor(null); }}>Transaction History</MenuItem>
      <MenuItem onClick={() => { setActiveTab(4); setBankingAnchor(null); }}>Issuance & Redemption</MenuItem>
      <MenuItem onClick={() => { setActiveTab(5); setBankingAnchor(null); }}>Loans</MenuItem>
      <MenuItem onClick={() => { setActiveTab(11); setAdminAnchor(null); }}>Fiat Banking</MenuItem>
    </Menu>

    {/* Advanced Dropdown */}
    <Button
      color="inherit"
      onClick={(e) => setAdvancedAnchor(e.currentTarget)}
      endIcon={<ArrowDropDownIcon />}
    >
      Advanced
    </Button>
    <Menu anchorEl={advancedAnchor} open={Boolean(advancedAnchor)} onClose={() => setAdvancedAnchor(null)}>
      <MenuItem onClick={() => { setActiveTab(6); setAdvancedAnchor(null); }}>Atomic Swaps</MenuItem>
      <MenuItem onClick={() => { setActiveTab(7); setAdvancedAnchor(null); }}>Multi-Sig Wallets</MenuItem>
      <MenuItem onClick={() => { setActiveTab(8); setAdvancedAnchor(null); }}>Multi-Chain Wallet</MenuItem>
      <MenuItem onClick={() => { setActiveTab(15); setAdvancedAnchor(null); }}>Cross-Chain Swap</MenuItem>
    </Menu>

    {/* Admin Dropdown */}
    <Button
      color="inherit"
      onClick={(e) => setAdminAnchor(e.currentTarget)}
      endIcon={<ArrowDropDownIcon />}
    >
      Admin
    </Button>
    <Menu anchorEl={adminAnchor} open={Boolean(adminAnchor)} onClose={() => setAdminAnchor(null)}>
      <MenuItem onClick={() => { setActiveTab(9); setAdminAnchor(null); }}>Bank Admin</MenuItem>
      <MenuItem onClick={() => { setActiveTab(10); setAdminAnchor(null); }}>Compliance</MenuItem>
      <MenuItem onClick={() => { setActiveTab(13); setAdminAnchor(null); }}>Ledger Analyzer</MenuItem>
      <MenuItem onClick={() => { setActiveTab(14); setAdminAnchor(null); }}>Debug</MenuItem>
    </Menu>

    <Typography variant="body1" sx={{ ml: 2 }}>
      Welcome, {getDisplayName(party)}
    </Typography>
    <Button color="inherit" onClick={handleLogout}>
      Logout
    </Button>
  </Box>
</Toolbar>
         
        </AppBar>
        {/* Update the activeTab checks in your content rendering */}
{activeTab === 0 && <Dashboard />}
{activeTab === 1 && <TransferProposals />}
{activeTab === 2 && <TransactionHistory />}

{/* Advanced Features - shifted by 1 divider */}
{activeTab === 4 && <IssuanceRedemption />}
{activeTab === 5 && <Loans />}
{activeTab === 6 && <AtomicSwaps />}
{activeTab === 7 && <MultiSigWallets />}
{activeTab === 8 && <MultiChainWallet />}
{activeTab === 15 && <CrossChainSwap />}
{/* Administration - shifted by 2 dividers */}
{activeTab === 9 && <BankAdmin />}
{activeTab === 10 && <ComplianceManagement />}
{activeTab === 11 && <RealBankingDashboard />}

{/* Tools - shifted by 3 dividers */}
{activeTab === 13 && <BlockchainAnalyzer />}
{activeTab === 14 && <DebugInfo />}
      </Container>
      </WalletProvider>
    </DamlLedger>
  );
};

export default App;