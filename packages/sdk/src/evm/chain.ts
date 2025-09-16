import { defineChain, Chain } from 'viem';

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

export const createChain = (provider: any): Chain => {
  const activeEndpoint: string = provider.endpoint;
  const allWs = [activeEndpoint, ...rpcWebsocketList];

  const rpcs = Array.from(
    new Set(
      allWs.map((e) =>
        e.replace('wss://', 'https://').replace('ws://', 'http://')
      )
    )
  );

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
        http: rpcs,
      },
    },
    blockExplorers: {
      default: {
        name: 'Hydration Explorer',
        url: 'https://hydration.subscan.io',
      },
    },
    testnet: false,
  }) as Chain;
};
