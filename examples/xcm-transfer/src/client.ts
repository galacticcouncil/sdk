import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  http,
} from 'viem';

export const hydraChain = defineChain({
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
  testnet: false,
});

export const hydraDxPublicClient = createPublicClient({
  chain: hydraChain,
  transport: http(),
});

export const hydraDxWalletClient = createWalletClient({
  account: 'INSERT_ADDRESS' as `0x${string}`,
  chain: hydraChain,
  transport: custom(window['ethereum']),
});

const moonbeam = defineChain({
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

export const moonbeamPublicClient = createPublicClient({
  chain: moonbeam,
  transport: http(),
});

export const moonbeamWalletClient = createWalletClient({
  account: 'INSERT_ACCOUNT' as `0x${string}`,
  chain: moonbeam,
  transport: custom(window['ethereum']),
});
