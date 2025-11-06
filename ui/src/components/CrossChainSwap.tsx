import React from 'react';
import { Container, Header, Icon, Segment } from 'semantic-ui-react';
import TokenSwap from './TokenSwap';

const CrossChainSwap: React.FC = () => {
  return (
    <Container style={{ marginTop: '2em' }}>
      <Header as='h1' textAlign='center'>
        <Icon name='exchange' />
        Cross-Chain Token Swap
      </Header>
      
      <Segment>
        <TokenSwap />
      </Segment>
    </Container>
  );
};

export default CrossChainSwap;