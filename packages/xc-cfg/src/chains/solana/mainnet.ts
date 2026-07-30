import {
  ChainEcosystem as Ecosystem,
  SolanaChain,
  SolanaBalanceType,
} from '@galacticcouncil/xc-core';

import { jito_sol, prime, sol } from '../../assets';

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
  wormhole: {
    id: 1,
    coreBridge: 'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth',
    // Locking managers - the spl token is escrowed here, minted on
    // hydration. `emitter` (the transceiver's pda) is unset: outbound
    // solana transfers need a program builder that doesn't exist yet.
    ntt: {
      [sol.key]: {
        token: 'So11111111111111111111111111111111111111112',
        manager: 'DiGxk55uAQNVzzg2FucPgdrQ4azb5SDvWQvzpzJD3o7J',
        transceiver: {
          wormhole: '5J12e7mMcbbN3VkCrUPfZp2bDHMH3t1rKvxGcwuN53wx',
        },
      },
      [jito_sol.key]: {
        token: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
        manager: '9HFvXujdkXubvmf93gyzkH1g3VPowDrmp85sWsfdcBTh',
        transceiver: {
          wormhole: 'HgxvrPomT84AxgxknddAcC1iW9ysqHxmeoiKNZmQcovs',
        },
      },
      [prime.key]: {
        token: '3b8X44fLF9ooXaUm3hhSgjpmVs6rZZ3pPoGnGahc3Uu7',
        manager: '4T5m5NtRVewiCVzP2mnfeUoMYRqncfkrS21X2dhVCNRT',
        transceiver: {
          wormhole: 'GiTY93vtrK4jZZchrxdV9r28JByRs7Ary2rsTPyPabJc',
        },
      },
    },
    platformAddressFormat: 'base58',
  },
});
