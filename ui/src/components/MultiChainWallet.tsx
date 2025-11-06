import React from 'react';
import { Container, Header, Icon, Segment } from 'semantic-ui-react';
import WalletConnect from './WalletConnect';

const MultiChainWallet: React.FC = () => {
  return (
    <Container style={{ marginTop: '2em' }}>
      <Header as='h1' textAlign='center'>
        <Icon name='ethereum' />
        Multi-Chain Wallet
      </Header>
      
      <Segment>
        <WalletConnect />
      </Segment>
    </Container>
  );
};

export default MultiChainWallet;