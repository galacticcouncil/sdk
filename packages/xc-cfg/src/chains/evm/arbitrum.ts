import {
  ChainEcosystem as Ecosystem,
  EvmChain,
} from '@galacticcouncil/xc-core';

import { eth, usdc } from '../../assets';
import { arbitrum as evmChain } from 'viem/chains';

export const arbitrum = new EvmChain({
  id: 42161,
  key: 'arbitrum',
  name: 'Arbitrum',
  assetsData: [
    {
      asset: eth,
      decimals: 18,
      id: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    },
    {
      asset: usdc,
      decimals: 6,
      id: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    },
  ],
  ecosystem: Ecosystem.Ethereum,
  evmChain: evmChain,
  explorer: 'https://arbiscan.io/',
  rpcs: [
    'https://arbitrum-one.publicnode.com',
    'https://arb1.arbitrum.io/rpc',
    'https://endpoints.omniatech.io/v1/arbitrum/one/public',
  ],
  across: {
    spokePool: '0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A',
    multicallHandler: '0x924a9f036260DdD5808007E1AA95f08eD08aA569',
    snowbridgeL2Adaptor: '0x836895ad176235dfe9c59b3df56c7579d90ea338',
  },
});
