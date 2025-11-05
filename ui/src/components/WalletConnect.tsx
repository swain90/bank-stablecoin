import React, { useState, useEffect } from 'react';
import { Button, Modal, Card, Icon, Label, Segment, Header, Grid, Message } from 'semantic-ui-react';
import { useWallet } from '../contexts/WalletContext';

const WalletConnect: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { address, isConnected, chainId, balance, connect, disconnect } = useWallet();
      // Auto-close modal when connection succeeds
  useEffect(() => {
    if (isConnected && modalOpen) {
      setModalOpen(false);
    }
  }, [isConnected, modalOpen]);
  const wallets = [
    { id: 'metaMask', name: 'MetaMask', icon: '🦊', description: 'Browser Extension' },
    { id: 'walletConnect', name: 'WalletConnect', icon: '🔗', description: 'Mobile Wallets' },
  ];

  const chains: { [key: number]: { name: string; icon: string; color: any } } = {
    11155111: { name: 'Sepolia', icon: '⟠', color: 'blue' }, // Sepolia
    80001: { name: 'Mumbai', icon: '🟣', color: 'purple' }, // Polygon Mumbai
    421614: { name: 'Arbitrum Sepolia', icon: '🔵', color: 'blue' },
    11155420: { name: 'Optimism Sepolia', icon: '🔴', color: 'red' },
  };

  const handleConnect = (connectorId: string) => {
    console.log('Connecting with:', connectorId);
    connect(connectorId);
    // Don't close modal here - the useEffect will close it when isConnected becomes true
  };

  const getChainInfo = (id?: number) => {
    return chains[id || 11155111] || { name: 'Unknown Network', icon: '❓', color: 'grey' };
  };

  if (isConnected && address) {
    const chainInfo = getChainInfo(chainId);
    
    return (
      <Segment>
        <Grid columns={2}>
          <Grid.Column width={12}>
            <Header as='h3'>
              <Icon name='ethereum' color='blue' />
              Wallet Connected
              <Label color={chainInfo.color} style={{ marginLeft: '10px' }}>
                {chainInfo.icon} {chainInfo.name}
              </Label>
            </Header>
            
            <div style={{ marginTop: '10px' }}>
              <p>
                <strong>Address:</strong>{' '}
                <code>{address.slice(0, 6)}...{address.slice(-4)}</code>
              </p>
              <p>
                <strong>Balance:</strong>{' '}
                {balance ? `${parseFloat(balance).toFixed(4)} ETH` : 'Loading...'}
              </p>
            </div>
          </Grid.Column>
          
          <Grid.Column width={4} textAlign='right'>
            <Button color='red' onClick={disconnect}>
              <Icon name='sign out' />
              Disconnect
            </Button>
          </Grid.Column>
        </Grid>
      </Segment>
    );
  }

  return (
    <>
      <Button primary size='large' onClick={() => setModalOpen(true)}>
        <Icon name='plug' />
        Connect Wallet
      </Button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size='small'>
        <Modal.Header>
          <Icon name='ethereum' />
          Connect Your Wallet
        </Modal.Header>
        <Modal.Content>
          <Header sub>Select a wallet to connect</Header>
          <Card.Group itemsPerRow={2}>
            {wallets.map(wallet => (
              <Card 
                key={wallet.id} 
                onClick={() => handleConnect(wallet.id)} 
                style={{ cursor: 'pointer' }}
                color='blue'
              >
                <Card.Content textAlign='center'>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                    {wallet.icon}
                  </div>
                  <Card.Header>{wallet.name}</Card.Header>
                  <Card.Meta>{wallet.description}</Card.Meta>
                </Card.Content>
              </Card>
            ))}
          </Card.Group>
          
          <Message info style={{ marginTop: '15px' }}>
            <Message.Header>Using Testnets</Message.Header>
            <p>Make sure MetaMask is switched to Sepolia or Mumbai testnet.</p>
          </Message>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
        </Modal.Actions>
      </Modal>
    </>
  );
};

export default WalletConnect;