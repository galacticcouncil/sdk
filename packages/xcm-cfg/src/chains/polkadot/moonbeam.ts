import {
  ChainEcosystem as Ecosystem,
  EvmParachain,
} from '@galacticcouncil/xcm-core';

import { defineChain, Chain } from 'viem';

import {
  aca,
  dai_mwh,
  dot,
  glmr,
  hdx,
  jito_sol,
  pink,
  prime,
  sol,
  susds_mwh,
  sui,
  usdc,
  usdc_mwh,
  usdt,
  usdt_mwh,
  wbtc_mwh,
  weth_mwh,
  eurc,
} from '../../assets';

const evmChain: Chain = defineChain({
  id: 1284,
  name: 'Moonbeam',
  network: 'moonbeam',
  nativeCurrency: {
    decimals: 18,
    name: 'GLMR',
    symbol: 'GLMR',
  },
  rpcUrls: {
    public: {
      http: ['https://rpc.api.moonbeam.network'],
      webSocket: ['wss://wss.api.moonbeam.network'],
    },
    default: {
      http: ['https://rpc.api.moonbeam.network'],
      webSocket: ['wss://wss.api.moonbeam.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Moonscan',
      url: 'https://moonscan.io',
    },
    etherscan: {
      name: 'Moonscan',
      url: 'https://moonscan.io',
    },
  },
  testnet: false,
});

export const moonbeam = new EvmParachain({
  assetsData: [
    {
      asset: glmr,
      id: '0x0000000000000000000000000000000000000802',
      min: 0.1,
      xcmLocation: {
        parents: 0,
        interior: {
          X1: [
            {
              PalletInstance: 10,
            },
          ],
        },
      },
    },
    {
      asset: dai_mwh,
      decimals: 18,
      id: '0x06e605775296e851FF43b4dAa541Bb0984E9D6fD',
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0x06e605775296e851ff43b4daa541bb0984e9d6fd',
              },
            },
          ],
        },
      },
    },
    {
      asset: eurc,
      decimals: 6,
      id: '0x3f9610a50630bc7d4530736942ee2bc9e00e8de8',
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0x3f9610a50630bc7d4530736942ee2bc9e00e8de8',
              },
            },
          ],
        },
      },
    },
    {
      asset: sol,
      decimals: 9,
      id: '0x99Fec54a5Ad36D50A4Bba3a41CAB983a5BB86A7d',
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0x99Fec54a5Ad36D50A4Bba3a41CAB983a5BB86A7d',
              },
            },
          ],
        },
      },
    },
    {
      asset: jito_sol,
      decimals: 9,
      id: '0xe9f9a2e3deae4093c00fbc57b22bb51a4c05ad88',
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0xe9f9a2e3deae4093c00fbc57b22bb51a4c05ad88',
              },
            },
          ],
        },
      },
    },
    {
      asset: prime,
      decimals: 6,
      id: '0x52b2f622f5676e92dbea3092004eb9ffb85a8d07',
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0x52b2f622f5676e92dbea3092004eb9ffb85a8d07',
              },
            },
          ],
        },
      },
    },
    {
      asset: susds_mwh,
      decimals: 18,
      id: '0xda430218862d3db25de9f61458645dde49a9e9c1',
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0xda430218862d3db25de9f61458645dde49a9e9c1',
              },
            },
          ],
        },
      },
    },
    {
      asset: sui,
      decimals: 9,
      id: '0x484ecce6775143d3335ed2c7bcb22151c53b9f49',
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0x484ecce6775143d3335ed2c7bcb22151c53b9f49',
              },
            },
          ],
        },
      },
    },
    {
      asset: usdc_mwh,
      decimals: 6,
      id: '0x931715FEE2d06333043d11F658C8CE934aC61D0c',
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0x931715FEE2d06333043d11F658C8CE934aC61D0c',
              },
            },
          ],
        },
      },
    },
    {
      asset: usdt_mwh,
      decimals: 6,
      id: '0xc30E9cA94CF52f3Bf5692aaCF81353a27052c46f',
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0xc30E9cA94CF52f3Bf5692aaCF81353a27052c46f',
              },
            },
          ],
        },
      },
    },
    {
      asset: wbtc_mwh,
      decimals: 8,
      id: '0xE57eBd2d67B462E9926e04a8e33f01cD0D64346D',
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0xE57eBd2d67B462E9926e04a8e33f01cD0D64346D',
              },
            },
          ],
        },
      },
    },
    {
      asset: weth_mwh,
      decimals: 18,
      id: '0xab3f0245B83feB11d15AAffeFD7AD465a59817eD',
      xcmLocation: {
        parents: 0,
        interior: {
          X2: [
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0xab3f0245B83feB11d15AAffeFD7AD465a59817eD',
              },
            },
          ],
        },
      },
    },
    // xc-20 assets
    {
      asset: aca,
      decimals: 12,
      id: '0xffffffffa922fef94566104a6e5a35a4fcddaa9f',
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2000,
            },
            {
              GeneralKey: {
                length: 2,
                data: '0x0000000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: dot,
      decimals: 10,
      id: '0xffffffff1fcacbd218edc0eba20fc2308c778080',
      xcmLocation: {
        parents: 1,
        interior: 'Here',
      },
    },
    {
      asset: hdx,
      decimals: 12,
      id: '0xffffffff345dc44ddae98df024eb494321e73fcc',
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2034,
            },
            {
              GeneralIndex: 0,
            },
          ],
        },
      },
    },
    {
      asset: pink,
      decimals: 10,
      id: '0xffffffff30478fafbe935e466da114e14fb3563d',
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 1000,
            },
            {
              PalletInstance: 50,
            },
            {
              GeneralIndex: 23,
            },
          ],
        },
      },
    },
    {
      asset: usdc,
      decimals: 6,
      id: '0xffffffff7d2b0b761af01ca8e25242976ac0ad7d',
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 1000,
            },
            {
              PalletInstance: 50,
            },
            {
              GeneralIndex: 1337,
            },
          ],
        },
      },
    },
    {
      asset: usdt,
      decimals: 6,
      id: '0xffffffffea09fb06d082fd1275cd48b191cbcd1d',
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 1000,
            },
            {
              PalletInstance: 50,
            },
            {
              GeneralIndex: 1984,
            },
          ],
        },
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  evmChain: evmChain,
  explorer: 'https://moonbeam.subscan.io',
  genesisHash:
    '0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d',
  key: 'moonbeam',
  name: 'Moonbeam',
  parachainId: 2004,
  ss58Format: 1284,
  usesH160Acc: true,
  wormhole: {
    id: 16,
    coreBridge: '0xC8e2b0cD52Cf01b0Ce87d389Daa3d414d4cE29f3',
    tokenBridge: '0xb1731c586ca89a23809861c6103f0b96b3f57d92',
    tokenRelayer: '0xCafd2f0A35A4459fA40C0517e17e6fA2939441CA',
  },
  ws: 'wss://wss.api.moonbeam.network',
});
