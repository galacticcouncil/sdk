import { defineChain, Chain } from 'viem';

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
