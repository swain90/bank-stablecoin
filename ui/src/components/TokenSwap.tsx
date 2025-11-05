import React, { useState } from 'react';
import { Segment, Header, Icon, Form, Button, Message, Statistic, Label } from 'semantic-ui-react';
import { useWallet } from '../contexts/WalletContext';
import { showSuccess, showError } from './Toast';

const TokenSwap: React.FC = () => {
  const { address, isConnected, chainId } = useWallet();
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('STABLECOIN');
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('0');
  const [isSwapping, setIsSwapping] = useState(false);

  const tokens = [
    { key: 'usdc', text: 'USDC', value: 'USDC', icon: 'dollar' },
    { key: 'usdt', text: 'USDT', value: 'USDT', icon: 'dollar' },
    { key: 'dai', text: 'DAI', value: 'DAI', icon: 'dollar' },
    { key: 'stablecoin', text: 'DAML Stablecoin', value: 'STABLECOIN', icon: 'shield' },
  ];

  const handleSwap = async () => {
    if (!isConnected) {
      showError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    setIsSwapping(true);

    try {
      // TODO: Implement actual swap logic
      // This would integrate with Uniswap, 1inch, or custom DEX
      
      // For now, simulate swap
      await new Promise(resolve => setTimeout(resolve, 2000));

      showSuccess(`Swapped ${amount} ${fromToken} for ${estimatedOutput} ${toToken}`);
      setAmount('');
      setEstimatedOutput('0');
    } catch (error: any) {
      showError(`Swap failed: ${error.message}`);
    } finally {
      setIsSwapping(false);
    }
  };

  const calculateEstimate = (inputAmount: string) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setEstimatedOutput('0');
      return;
    }

    // Simple 1:1 swap for now (in production, fetch real exchange rates)
    const slippage = 0.005; // 0.5% slippage
    const output = parseFloat(inputAmount) * (1 - slippage);
    setEstimatedOutput(output.toFixed(2));
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    calculateEstimate(value);
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    calculateEstimate(amount);
  };

  if (!isConnected) {
    return (
      <Message warning>
        <Message.Header>Wallet Not Connected</Message.Header>
        <p>Please connect your wallet to use the swap feature.</p>
      </Message>
    );
  }

  return (
    <Segment>
      <Header as='h2'>
        <Icon name='exchange' />
        Token Swap
      </Header>

      <Form>
        <Form.Group widths='equal'>
          <Form.Select
            fluid
            label='From'
            options={tokens}
            value={fromToken}
            onChange={(_, { value }) => setFromToken(value as string)}
          />
          <Form.Input
            fluid
            label='Amount'
            type='number'
            placeholder='0.00'
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
          />
        </Form.Group>

        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <Button icon='exchange' circular onClick={swapTokens} />
        </div>

        <Form.Group widths='equal'>
          <Form.Select
            fluid
            label='To'
            options={tokens.filter(t => t.value !== fromToken)}
            value={toToken}
            onChange={(_, { value }) => setToToken(value as string)}
          />
          <Form.Input
            fluid
            label='Estimated Output'
            type='text'
            value={estimatedOutput}
            readOnly
          />
        </Form.Group>

        {parseFloat(amount) > 0 && (
          <Message info>
            <Statistic.Group size='mini' widths={3}>
              <Statistic>
                <Statistic.Label>Exchange Rate</Statistic.Label>
                <Statistic.Value>1:1</Statistic.Value>
              </Statistic>
              <Statistic>
                <Statistic.Label>Slippage</Statistic.Label>
                <Statistic.Value>0.5%</Statistic.Value>
              </Statistic>
              <Statistic>
                <Statistic.Label>Fee</Statistic.Label>
                <Statistic.Value>0.3%</Statistic.Value>
              </Statistic>
            </Statistic.Group>
          </Message>
        )}

        <Button
          primary
          fluid
          size='large'
          loading={isSwapping}
          disabled={!amount || parseFloat(amount) <= 0}
          onClick={handleSwap}
        >
          <Icon name='exchange' />
          Swap Tokens
        </Button>
      </Form>

      <Label attached='bottom' color='blue'>
        <Icon name='shield' />
        Powered by Uniswap Protocol
      </Label>
    </Segment>
  );
};

export default TokenSwap;