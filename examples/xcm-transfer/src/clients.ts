import { createWalletClient, createPublicClient, webSocket, defineChain } from 'viem';

const transport = webSocket('wss://eth-rpc-acala.aca-api.network/ws');

export const acala = /*#__PURE__*/ defineChain({
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

export const publicClient = createPublicClient({
  chain: acala,
  transport,
});

export const walletClient = createWalletClient({
  chain: acala,
  transport,
});
