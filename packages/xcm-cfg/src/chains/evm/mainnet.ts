import {
  ChainEcosystem as Ecosystem,
  EvmChain,
} from '@galacticcouncil/xcm-core';

import {
  aave,
  dai,
  eth,
  lbtc,
  ldo,
  link,
  sky,
  susde,
  susds,
  tbtc,
  usdc,
  usdt,
  wbtc,
  weth,
  wsteth,
} from '../../assets';

import { mainnet as evmChain } from 'viem/chains';

export const ethereum = new EvmChain({
  id: 1,
  key: 'ethereum',
  name: 'Ethereum',
  assetsData: [
    {
      asset: eth,
      decimals: 18,
      id: '0x0000000000000000000000000000000000000000',
    },
    {
      asset: aave,
      decimals: 18,
      id: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    },
    {
      asset: weth,
      decimals: 18,
      id: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
    {
      asset: dai,
      decimals: 18,
      id: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    },
    {
      asset: susde,
      decimals: 18,
      id: '0x9d39a5de30e57443bff2a8307a4256c8797a3497',
    },
    {
      asset: susds,
      decimals: 18,
      id: '0xa3931d71877c0e7a3148cb7eb4463524fec27fbd',
    },
    {
      asset: tbtc,
      decimals: 18,
      id: '0x18084fba666a33d37592fa2633fd49a74dd93a88',
    },
    {
      asset: wbtc,
      decimals: 8,
      id: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    },
    {
      asset: lbtc,
      decimals: 8,
      id: '0x8236a87084f8b84306f72007f36f2618a5634494',
    },
    {
      asset: usdc,
      decimals: 6,
      id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    {
      asset: usdt,
      decimals: 6,
      id: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
    {
      asset: ldo,
      decimals: 18,
      id: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
    },
    {
      asset: link,
      decimals: 18,
      id: '0x514910771af9ca656af840dff83e8264ecf986ca',
    },
    {
      asset: sky,
      decimals: 18,
      id: '0x56072c95faa701256059aa122697b133aded9279',
    },
    {
      asset: wsteth,
      decimals: 18,
      id: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    },
  ],
  ecosystem: Ecosystem.Ethereum,
  evmChain: evmChain,
  explorer: 'https://etherscan.io/',
  rpcs: [
    'https://ethereum-rpc.publicnode.com',
    'https://cosmopolitan-dimensional-diagram.quiknode.pro',
  ],
  snowbridge: {
    id: 1,
    gateway: '0x27ca963c279c93801941e1eb8799c23f407d68e7',
  },
  wormhole: {
    id: 2,
    coreBridge: '0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B',
    tokenBridge: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
    tokenRelayer: '0xCafd2f0A35A4459fA40C0517e17e6fA2939441CA',
  },
});
