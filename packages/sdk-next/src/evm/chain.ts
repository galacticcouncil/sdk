import { defineChain, Chain } from 'viem';

const rpcHttpList = [
  'https://hydration-rpc.n.dwellir.com',
  'https://hydration.dotters.network',
  'https://rpc.helikon.io/hydradx',
  'https://hydration.ibp.network',
  'https://rpc.cay.hydration.cloud',
  'https://rpc.parm.hydration.cloud',
  'https://rpc.roach.hydration.cloud',
  'https://rpc.zipp.hydration.cloud',
  'https://rpc.sin.hydration.cloud',
  'https://rpc.coke.hydration.cloud',
];

const rpcWebsocketList = [
  'wss://hydration-rpc.n.dwellir.com',
  'wss://hydration.dotters.network',
  'wss://rpc.helikon.io/hydradx',
  'wss://hydration.ibp.network',
  'wss://rpc.cay.hydration.cloud',
  'wss://rpc.parm.hydration.cloud',
  'wss://rpc.roach.hydration.cloud',
  'wss://rpc.zipp.hydration.cloud',
  'wss://rpc.sin.hydration.cloud',
  'wss://rpc.coke.hydration.cloud',
];

export const evmMainnet: Chain = defineChain({
  id: 222222,
  name: 'Hydration',
  network: 'hydration',
  nativeCurrency: {
    decimals: 18,
    name: 'WETH',
    symbol: 'WETH',
  },
  rpcUrls: {
    public: {
      http: rpcHttpList,
      webSocket: rpcWebsocketList,
    },
    default: {
      http: rpcHttpList,
      webSocket: rpcWebsocketList,
    },
  },
  blockExplorers: {
    default: {
      name: 'Hydration Explorer',
      url: 'https://explorer.evm.hydration.cloud',
    },
  },
  testnet: false,
});
