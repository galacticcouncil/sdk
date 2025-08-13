import {
  ChainEcosystem as Ecosystem,
  EvmChain,
} from '@galacticcouncil/xcm-core';

import {
  sqd,
} from '../../assets';

import { bsc as evmChain } from 'viem/chains';

export const bsc = new EvmChain({
  id: 56,
  key: 'bsc',
  name: 'BNB Smart Chain',
  assetsData: [
    {
      asset: sqd,
      decimals: 18,
      id: '0xe50E3d1A46070444F44df911359033F2937fcC13',
    },
  ],
  ecosystem: Ecosystem.Ethereum,
  evmChain: evmChain,
  explorer: 'https://bscscan.com/',
  rpcs: [
    'https://56.rpc.thirdweb.com',
    'https://bsc-dataseed.binance.org',
  ],
  wormhole: {
    id: 4,
    coreBridge: '0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B',
    tokenBridge: '0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7',
    tokenRelayer: '0xCafd2f0A35A4459fA40C0517e17e6fA2939441CA',
  },
});
