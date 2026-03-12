import {
  ChainEcosystem as Ecosystem,
  EvmChain,
} from '@galacticcouncil/xcm-core';

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
  ecosystem: Ecosystem.Ethereum,
  evmChain: evmChain,
  explorer: 'https://basescan.org/',
  rpcs: ['https://stylish-quick-firefly.base-mainnet.quiknode.pro/'],
  hyperbridge: {
    id: 8453,
    gateway: '0xfd413e3afe560182c4471f4d143a96d3e259b6de',
    ismpHost: '0x6FFe92e4d7a9D589549644544780e6725E84b248',
    feeAsset: usdc,
  },
  wormhole: {
    id: 30,
    coreBridge: '0xbebdb6C8ddC678FfA9f8748f85C815C556Dd8ac6',
    tokenBridge: '0x8d2de8d2f73F1F4cAB472AC9A881C9b123C79627',
  },
  uniswapV2: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86',
});
