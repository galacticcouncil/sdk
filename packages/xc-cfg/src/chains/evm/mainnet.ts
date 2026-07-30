import {
  ChainEcosystem as Ecosystem,
  EvmChain,
  EvmBalanceType,
} from '@galacticcouncil/xc-core';

import {
  aave,
  apyusd,
  cfg_new,
  dai,
  ena,
  eth,
  lbtc,
  ldo,
  link,
  paxg,
  sky,
  susde,
  susds,
  tbtc,
  trac,
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
      asset: apyusd,
      decimals: 18,
      id: '0x38eeb52f0771140d10c4e9a9a72349a329fe8a6a',
    },
    {
      asset: cfg_new,
      decimals: 18,
      id: '0xcccccccccc33d538dbc2ee4feab0a7a1ff4e8a94',
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
      asset: ena,
      decimals: 18,
      id: '0x57e114b691db790c35207b2e685d4a43181e6061',
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
      asset: paxg,
      decimals: 18,
      id: '0x45804880de22913dafe09f4980848ece6ecbaf78',
    },
    {
      asset: sky,
      decimals: 18,
      id: '0x56072c95faa701256059aa122697b133aded9279',
    },
    {
      asset: trac,
      decimals: 18,
      id: '0xaA7a9CA87d3694B5755f213B5D04094b8d0F0A6F',
    },
    {
      asset: wsteth,
      decimals: 18,
      id: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    },
  ],
  balance: EvmBalanceType.Erc20,
  balanceOverrides: {
    [eth.key]: EvmBalanceType.Native,
  },
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
    executor: '0x84EEe8dBa37C36947397E1E11251cA9A06Fc6F8a',
    // Locking managers - the token is escrowed here, minted on hydration.
    ntt: {
      [dai.key]: {
        token: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        manager: '0x804F123f75cCa0A9c0Cba341F82f4A4DA86a5259',
        transceiver: {
          wormhole: '0x99673a01C5779Ebf59399B4B228c1825c0113571',
        },
      },
      [susds.key]: {
        token: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
        manager: '0x5085A4863f89eC9553F70187EE73B5aAe0fd14b5',
        transceiver: {
          wormhole: '0x7C236d237BEbBE1b7902131B31b7b3270005a810',
        },
      },
      [usdc.key]: {
        token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        manager: '0x447b2c7485A3d6813F8197E605b10BcCD8dd8398',
        transceiver: {
          wormhole: '0xA108BD5dBc6CE665aEbB6895351e0609c76F8EFc',
        },
      },
      [usdt.key]: {
        token: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        manager: '0x9fbd9F16cE7Fa17097E91cc36DC1B7b47aDCa9De',
        transceiver: {
          wormhole: '0x45c566f6595CF93e639E77cc1bbE57A8D27901c2',
        },
      },
      [wbtc.key]: {
        token: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        manager: '0x081b76AC3cFb65DCe93961d66cea44A74EC8Ef28',
        transceiver: {
          wormhole: '0x3FE8fBB8505c8dB2264f6Ebc5559c7C2b2647218',
        },
      },
      [weth.key]: {
        token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        manager: '0x283B14B5Dd352e32154Df014EA96834F395E04b6',
        transceiver: {
          wormhole: '0xbA0Cd32131b8206AF4feB79A1A3aaF0AEfe18b48',
        },
      },
    },
  },
});
