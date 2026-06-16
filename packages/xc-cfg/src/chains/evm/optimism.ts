import {
  ChainEcosystem as Ecosystem,
  EvmChain,
} from '@galacticcouncil/xc-core';

import { eth, usdc } from '../../assets';
import { optimism as evmChain } from 'viem/chains';

export const optimism = new EvmChain({
  id: 10,
  key: 'optimism',
  name: 'Optimism',
  assetsData: [
    {
      asset: eth,
      decimals: 18,
      id: '0x4200000000000000000000000000000000000006',
    },
    {
      asset: usdc,
      decimals: 6,
      id: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    },
  ],
  ecosystem: Ecosystem.Ethereum,
  evmChain: evmChain,
  explorer: 'https://optimistic.etherscan.io/',
  rpcs: [
    'https://optimism.publicnode.com',
    'https://mainnet.optimism.io',
    'https://endpoints.omniatech.io/v1/op/mainnet/public',
  ],
  across: {
    spokePool: '0x6f26Bf09B1C792e3228e5467807a900A503c0281',
    multicallHandler: '0x924a9f036260DdD5808007E1AA95f08eD08aA569',
    snowbridgeL2Adaptor: '0x836895ad176235dfe9c59b3df56c7579d90ea338',
  },
});
