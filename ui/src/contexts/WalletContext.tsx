// @ts-nocheck
import React, { createContext, useContext, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { createConfig } from '@wagmi/core';
import { http } from 'viem';
import { sepolia, polygonMumbai, arbitrumSepolia, optimismSepolia } from 'viem/chains';
import { injected, walletConnect } from '@wagmi/connectors';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create query client
const queryClient = new QueryClient();

// Create wagmi config
const config = createConfig({
  chains: [sepolia, polygonMumbai, arbitrumSepolia, optimismSepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId: '0a3fc14c4ea735512ac97ba826580151',
    }),
  ],
  transports: {
    // Use Alchemy public endpoint for Sepolia (faster and more reliable)
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/demo'),
    [polygonMumbai.id]: http('https://polygon-mumbai.g.alchemy.com/v2/demo'),
    [arbitrumSepolia.id]: http('https://arb-sepolia.g.alchemy.com/v2/demo'),
    [optimismSepolia.id]: http('https://opt-sepolia.g.alchemy.com/v2/demo'),
  },
});

interface WalletContextType {
  address?: `0x${string}`;
  isConnected: boolean;
  chainId?: number;
  balance?: string;
  connect: (connectorId: string) => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProviderInner>{children}</WalletProviderInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

const WalletProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect: wagmiConnect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  // Only fetch balance when we have an address
  const { data: balanceData, isLoading: balanceLoading, isError: balanceError } = useBalance({ 
    address: address,
    enabled: !!address, // Only fetch when address exists
  });

  useEffect(() => {
    console.log('🔄 Account state changed:', {
      address,
      isConnected,
      chainId,
      balance: balanceData?.formatted,
      balanceLoading,
      balanceError
    });
  }, [address, isConnected, chainId, balanceData, balanceLoading, balanceError]);
  
  // Debug logs
  console.log('🔍 WalletProviderInner state:', {
    address,
    isConnected,
    chainId,
    balance: balanceData?.formatted,
    balanceLoading,
    balanceError
  });

  const connect = async (connectorId: string) => {
    try {
      let connector;
      
      console.log('🔍 Looking for connector:', connectorId);
      console.log('📋 Available connectors:', connectors.map(c => ({ id: c.id, type: c.type, name: c.name })));
      
      if (connectorId === 'metaMask' || connectorId === 'metaMaskSDK') {
        connector = connectors.find((c: any) => c.id === 'io.metamask');
        
        if (!connector) {
          connector = connectors.find((c: any) => c.type === 'injected');
        }
      } else if (connectorId === 'walletConnect') {
        connector = connectors.find((c: any) => c.type === 'walletConnect');
      } else {
        connector = connectors.find((c: any) => c.id === connectorId);
      }
      
      console.log('✅ Found connector:', connector);
      
      if (connector) {
        console.log('🚀 Attempting to connect with:', connector.id);
        
        try {
          wagmiConnect({ connector });
          console.log('✅ Connection initiated!');
        } catch (connectError: any) {
          console.error('❌ Connect error:', connectError);
        }
      } else {
        console.error('❌ No connector found for:', connectorId);
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
    }
  };

  const value: WalletContextType = {
    address,
    isConnected,
    chainId,
    balance: balanceData?.formatted,
    connect,
    disconnect: wagmiDisconnect,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export { config };