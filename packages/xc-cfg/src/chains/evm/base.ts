import {
  ChainEcosystem as Ecosystem,
  EvmChain,
  EvmBalanceType,
} from '@galacticcouncil/xc-core';

import { eth, eurc, usdc } from '../../assets';
import { base as evmChain } from 'viem/chains';

export const base = new EvmChain({
  id: 8453,
  key: 'base',
  name: 'Base',
  assetsData: [
    {
      asset: eth,
      decimals: 18,
      id: '0x4200000000000000000000000000000000000006',
    },
    {
      asset: eurc,
      decimals: 6,
      id: '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42',
    },
    {
      asset: usdc,
      decimals: 6,
      id: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
  ],
  balance: EvmBalanceType.Erc20,
  ecosystem: Ecosystem.Ethereum,
  evmChain: evmChain,
  explorer: 'https://basescan.org/',
  rpcs: ['https://stylish-quick-firefly.base-mainnet.quiknode.pro/'],
  basejump: {
    address: '0xf5b9334e44f800382cb47fc19669401d694e529b',
  },
  wormhole: {
    id: 30,
    coreBridge: '0xbebdb6C8ddC678FfA9f8748f85C815C556Dd8ac6',
    executor: '0x9E1936E91A4a5AE5A5F75fFc472D6cb8e93597ea',
    // Locking manager - eurc is escrowed here, minted on hydration.
    ntt: {
      [eurc.key]: {
        token: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
        manager: '0xD1dc3517732c98502b5c1ba2389AcA9E9016d89a',
        transceiver: {
          wormhole: '0xa84b362290b0CFdB55e877dfc633284091e0B3F7',
        },
      },
    },
  },
});
