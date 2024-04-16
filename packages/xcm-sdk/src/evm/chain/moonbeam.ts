import { defineChain, Chain } from 'viem';

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
      webSocket: ['wss://wss.api.moonbeam.network'],
    },
    default: {
      http: ['https://rpc.api.moonbeam.network'],
      webSocket: ['wss://wss.api.moonbeam.network'],
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
