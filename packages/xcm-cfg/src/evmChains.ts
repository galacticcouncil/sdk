import { defineChain, Chain } from 'viem';

export const acala: Chain = defineChain({
  id: 1934,
  name: 'Acala',
  network: 'acala',
  nativeCurrency: {
    decimals: 12,
    name: 'ACA',
    symbol: 'ACA',
  },
  rpcUrls: {
    public: {
      http: ['https://eth-rpc-acala.aca-api.network'],
      webSocket: ['wss://eth-rpc-acala.aca-api.network'],
    },
    default: {
      http: ['https://eth-rpc-acala.aca-api.network'],
      webSocket: ['wss://eth-rpc-acala.aca-api.network'],
    },
  },
  testnet: false,
});

export const moonbeam: Chain = defineChain({
  id: 1284,
  name: 'Moonbeam',
  network: 'moonbeam',
  nativeCurrency: {
    decimals: 18,
    name: 'GLMR',
    symbol: 'GLMR',
  },
  rpcUrls: {
    public: {
      http: ['https://rpc.api.moonbeam.network'],
      webSocket: ['wss://rpc.api.moonbeam.network'],
    },
    default: {
      http: ['https://rpc.api.moonbeam.network'],
      webSocket: ['wss://rpc.api.moonbeam.network'],
    },
  },
  testnet: false,
});

export const hydradx: Chain = defineChain({
  id: 222222,
  name: 'HydraDX',
  network: 'hydradx',
  nativeCurrency: {
    decimals: 18,
    name: 'WETH',
    symbol: 'WETH',
  },
  rpcUrls: {
    public: {
      http: ['https://rpc.nice.hydration.cloud'],
      webSocket: ['wss://rpc.nice.hydration.cloud'],
    },
    default: {
      http: ['https://rpc.nice.hydration.cloud'],
      webSocket: ['wss://rpc.nice.hydration.cloud'],
    },
  },
  testnet: true,
});

export const evmChains: Record<string, Chain> = {
  acala: acala,
  hydradx: hydradx,
  moonbeam: moonbeam,
};
