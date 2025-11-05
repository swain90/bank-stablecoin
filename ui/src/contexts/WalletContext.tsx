// @ts-nocheck
import React, { createContext, useContext } from 'react';
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
    [sepolia.id]: http(),
    [polygonMumbai.id]: http(),
    [arbitrumSepolia.id]: http(),
    [optimismSepolia.id]: http(),
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
  const { data: balanceData } = useBalance({ address });

  const connect = (connectorId: string) => {
    let connector;
    
    if (connectorId === 'metaMask' || connectorId === 'metaMaskSDK') {
      connector = connectors.find((c: any) => c.type === 'injected');
    } else if (connectorId === 'walletConnect') {
      connector = connectors.find((c: any) => c.type === 'walletConnect');
    } else {
      connector = connectors.find((c: any) => c.id === connectorId);
    }
    
    if (connector) {
      wagmiConnect({ connector });
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