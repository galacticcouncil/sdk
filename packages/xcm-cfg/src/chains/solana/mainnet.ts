import {
  ChainEcosystem as Ecosystem,
  SolanaChain,
} from '@galacticcouncil/xcm-core';

import { sol } from '../../assets';

export const solana = new SolanaChain({
  id: 101,
  key: 'solana',
  name: 'Solana',
  assetsData: [
    {
      asset: sol,
      decimals: 9,
    },
  ],
  ecosystem: Ecosystem.Solana,
  rpcUrls: {
    http: ['https://solemn-chaotic-bush.solana-mainnet.quiknode.pro'],
    webSocket: ['wss://solemn-chaotic-bush.solana-mainnet.quiknode.pro'],
  },
  wormhole: {
    id: 1,
    coreBridge: 'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth',
    tokenBridge: 'wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb',
    platformAddressFormat: 'base58',
  },
});
