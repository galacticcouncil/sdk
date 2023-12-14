import { defineChain, Chain } from 'viem';

export const acala: Chain = defineChain({
  id: 787,
  name: 'Acala',
  network: 'acala',
  nativeCurrency: {
    decimals: 18,
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
  blockExplorers: {
    default: {
      name: 'Acala Blockscout',
      url: 'https://blockscout.acala.network',
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
  blockExplorers: {
    default: {
      name: 'Moonscan',
      url: 'https://moonscan.io',
    },
    etherscan: {
      name: 'Moonscan',
      url: 'https://moonscan.io',
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
      http: ['https://rpc.hydradx.cloud'],
      webSocket: ['wss://rpc.hydradx.cloud'],
    },
    default: {
      http: ['https://rpc.hydradx.cloud'],
      webSocket: ['wss://rpc.hydradx.cloud'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HydraDX Explorer',
      url: 'https://explorer.evm.hydration.cloud',
    },
  },
  testnet: false,
});

export const evmChains: Record<string, Chain> = {
  acala: acala,
  hydradx: hydradx,
  moonbeam: moonbeam,
};
