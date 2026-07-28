import {
  ChainEcosystem as Ecosystem,
  SolanaChain,
  SolanaBalanceType,
} from '@galacticcouncil/xc-core';

import { jito_sol, prime, sol } from '../../assets';
import { solanaNtt } from '../../ntt';

export const solana = new SolanaChain({
  id: 101,
  key: 'solana',
  name: 'Solana',
  assetsData: [
    {
      asset: sol,
      decimals: 9,
    },
    {
      asset: jito_sol,
      id: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
      decimals: 9,
    },
    {
      asset: prime,
      id: '3b8X44fLF9ooXaUm3hhSgjpmVs6rZZ3pPoGnGahc3Uu7',
      decimals: 6,
    },
  ],
  balance: SolanaBalanceType.Token,
  balanceOverrides: {
    [sol.key]: SolanaBalanceType.Native,
  },
  ecosystem: Ecosystem.Solana,
  explorer: 'https://explorer.solana.com/',
  rpcUrls: {
    http: ['https://wispy-palpable-market.solana-mainnet.quiknode.pro'],
    webSocket: ['wss://wispy-palpable-market.solana-mainnet.quiknode.pro'],
  },
  ntt: solanaNtt,
  wormhole: {
    id: 1,
    coreBridge: 'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth',
    platformAddressFormat: 'base58',
  },
});
