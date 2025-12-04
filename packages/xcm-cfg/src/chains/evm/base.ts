import {
  ChainEcosystem as Ecosystem,
  EvmChain,
} from '@galacticcouncil/xcm-core';

import { eth, eurc } from '../../assets';

import { base as evmChain } from 'viem/chains';

export const base = new EvmChain({
  id: 8453,
  key: 'base',
  name: 'Base',
  assetsData: [
    {
      asset: eth,
      decimals: 18,
      id: '0x0000000000000000000000000000000000000000',
    },
    {
      asset: eurc,
      decimals: 18,
      id: '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42',
    },
  ],
  ecosystem: Ecosystem.Ethereum,
  evmChain: evmChain,
  explorer: 'https://basescan.org/',
  rpcs: ['https://stylish-quick-firefly.base-mainnet.quiknode.pro/'],
  hyperbridge: {
    id: 8453,
    gateway: '0xfd413e3afe560182c4471f4d143a96d3e259b6de',
  },
});
