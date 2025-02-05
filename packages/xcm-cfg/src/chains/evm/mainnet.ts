import {
  ChainEcosystem as Ecosystem,
  EvmChain,
} from '@galacticcouncil/xcm-core';

import {
  aave,
  dai,
  eth,
  susde,
  susds,
  tbtc,
  usdc,
  usdt,
  wbtc,
  weth,
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
      id: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
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
      asset: usdc,
      decimals: 6,
      id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    {
      asset: usdt,
      decimals: 6,
      id: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
  ],
  ecosystem: Ecosystem.Ethereum,
  evmChain: evmChain,
  explorer: 'https://etherscan.io/',
  rpcs: [
    'https://ethereum-rpc.publicnode.com',
    'https://eth.llamarpc.com',
    'https://1rpc.io/eth',
  ],
  snowbridge: {
    id: 1,
    gateway: '0x27ca963c279c93801941e1eb8799c23f407d68e7',
    bridgeFee: 100_000_000n,
  },
  wormhole: {
    id: 2,
    coreBridge: '0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B',
    tokenBridge: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
    tokenRelayer: '0xCafd2f0A35A4459fA40C0517e17e6fA2939441CA',
  },
});
