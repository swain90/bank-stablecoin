import React, { useState } from 'react';
import { Segment, Header, Icon, Label, Message, Button, Form, Dropdown } from 'semantic-ui-react';
import { sepolia, polygonMumbai, arbitrumSepolia, optimismSepolia } from 'viem/chains';
import { useWallet } from '../contexts/WalletContext';
import { showSuccess, showError } from './Toast';

// Token interface
interface Token {
  symbol: string;
  address: string;
  chainId: number;
  decimals: number;
}

// Available tokens for testing
const AVAILABLE_TOKENS: Token[] = [
  { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', chainId: sepolia.id, decimals: 18 },
  { symbol: 'USDC', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', chainId: sepolia.id, decimals: 6 },
  { symbol: 'MATIC', address: '0x0000000000000000000000000000000000000000', chainId: polygonMumbai.id, decimals: 18 },
  { symbol: 'USDC', address: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97', chainId: polygonMumbai.id, decimals: 6 },
];

const TokenSwap: React.FC = () => {
  const { address, isConnected } = useWallet();
  
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwap = async () => {
    if (!fromToken || !toToken || !amount || !address) {
      showError('Please fill all fields and connect wallet');
      return;
    }

    setIsSwapping(true);
    try {
      if (fromToken.chainId === toToken.chainId) {
        // Same-chain swap via DEX
        showError('Same-chain swaps coming soon - integrate with Uniswap/DEX');
      } else {
        // Cross-chain swap via bridge
        showError('Cross-chain bridge integration coming soon - will use Axelar/LayerZero');
      }
    } catch (error: any) {
      console.error('Swap error:', error);
      showError(`Swap failed: ${error.message}`);
    } finally {
      setIsSwapping(false);
    }
  };

  const tokenOptions = AVAILABLE_TOKENS.map(token => ({
    key: `${token.symbol}-${token.chainId}`,
    text: `${token.symbol} (Chain ${token.chainId})`,
    value: `${token.symbol}-${token.chainId}`,
  }));

  const isCrossChain = fromToken && toToken && fromToken.chainId !== toToken.chainId;

  return (
    <Segment>
      <Header as='h2'>
        <Icon name='exchange' />
        Token Swap
        {isCrossChain && (
          <Label color='orange' style={{ marginLeft: '10px' }}>Cross-Chain</Label>
        )}
      </Header>

      {!isConnected && (
        <Message warning>
          <Icon name='warning' />
          Please connect your wallet first
        </Message>
      )}

      <Form style={{ paddingBottom: '50px' }}>
        <Form.Field>
          <label>From Token</label>
          <Dropdown
            placeholder='Select token'
            fluid
            selection
            options={tokenOptions}
            onChange={(_, data) => {
              const token = AVAILABLE_TOKENS.find(t => `${t.symbol}-${t.chainId}` === data.value);
              setFromToken(token || null);
            }}
          />
        </Form.Field>

        <Form.Field>
          <label>To Token</label>
          <Dropdown
            placeholder='Select token'
            fluid
            selection
            options={tokenOptions}
            onChange={(_, data) => {
              const token = AVAILABLE_TOKENS.find(t => `${t.symbol}-${t.chainId}` === data.value);
              setToToken(token || null);
            }}
          />
        </Form.Field>

        <Form.Input
          label='Amount'
          placeholder='0.0'
          type='number'
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {isCrossChain && (
          <Message info>
            <Icon name='info circle' />
            Cross-chain swaps will be powered by Axelar Network bridge protocol
          </Message>
        )}

        <Button
          primary
          fluid
          size='large'
          loading={isSwapping}
          disabled={!amount || parseFloat(amount) <= 0 || !address}
          onClick={handleSwap}
        >
          <Icon name='exchange' />
          {isCrossChain ? 'Bridge & Swap Tokens' : 'Swap Tokens'}
        </Button>
      </Form>

      <Label color='blue' style={{ marginTop: '15px' }}>
        <Icon name='shield' />
        Powered by {isCrossChain ? 'Axelar Network (Coming Soon)' : 'Uniswap Protocol (Coming Soon)'}
      </Label>
    </Segment>
  );
};

export default TokenSwap;