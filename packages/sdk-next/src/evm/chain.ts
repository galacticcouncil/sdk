import { defineChain, Chain } from 'viem';

const rpcWebsocketList = [
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

export const createChain = (): Chain => {
  return defineChain({
    id: 222222,
    name: 'Hydration',
    network: 'hydration',
    nativeCurrency: {
      decimals: 18,
      name: 'WETH',
      symbol: 'WETH',
    },
    rpcUrls: {
      default: {
        http: rpcWebsocketList,
      },
    },
    blockExplorers: {
      default: {
        name: 'Hydration Explorer',
        url: 'https://explorer.evm.hydration.cloud',
      },
    },
    testnet: false,
  }) as Chain;
};
