import {
  ChainEcosystem as Ecosystem,
  EvmParachain,
} from '@galacticcouncil/xcm-core';

import { defineChain, Chain } from 'viem';

import {
  aave,
  aca,
  ajun,
  astr,
  bnc,
  cfg,
  cru,
  dai_awh,
  dai_mwh,
  ded,
  dot,
  dota,
  eth,
  ewt,
  glmr,
  hdx,
  ibtc,
  intr,
  kilt,
  ksm,
  laos,
  ldo,
  ldot,
  link,
  myth,
  pen,
  pha,
  pink,
  ring,
  neuro,
  nodl,
  sub,
  sui,
  trac,
  unq,
  usdc,
  usdc_mwh,
  usdc_eth,
  usdt,
  usdt_mwh,
  usdt_eth,
  vastr,
  vdot,
  wbtc,
  wbtc_awh,
  wbtc_mwh,
  weth,
  weth_awh,
  weth_mwh,
  wsteth,
  wud,
  ztg,
  susde,
  susds,
  susds_mwh,
  sol,
  sky,
  tbtc,
  lbtc,
} from '../../assets';
import { HydrationEvmResolver } from '../../resolvers';

const evmResolver = new HydrationEvmResolver();

const rpcHttpList = [
  'https://hydration-rpc.n.dwellir.com',
  'https://hydration.dotters.network',
  'https://rpc.helikon.io/hydradx',
  'https://hydration.ibp.network',
  'https://rpc.cay.hydration.cloud',
  'https://rpc.parm.hydration.cloud',
  'https://rpc.roach.hydration.cloud',
  'https://rpc.zipp.hydration.cloud',
  'https://rpc.sin.hydration.cloud',
  'https://rpc.coke.hydration.cloud',
];

const rpcWebsocketList = [
  'wss://hydration-rpc.n.dwellir.com',
  'wss://hydration.dotters.network',
  'wss://rpc.helikon.io/hydradx',
  'wss://hydration.ibp.network',
  'wss://rpc.cay.hydration.cloud',
  'wss://rpc.parm.hydration.cloud',
  'wss://rpc.roach.hydration.cloud',
  'wss://rpc.zipp.hydration.cloud',
  'wss://rpc.sin.hydration.cloud',
  'wss://rpc.coke.hydration.cloud',
];

const evmChain: Chain = defineChain({
  id: 222222,
  name: 'Hydration',
  network: 'hydration',
  nativeCurrency: {
    decimals: 18,
    name: 'WETH',
    symbol: 'WETH',
  },
  rpcUrls: {
    public: {
      http: rpcHttpList,
      webSocket: rpcWebsocketList,
    },
    default: {
      http: rpcHttpList,
      webSocket: rpcWebsocketList,
    },
  },
  blockExplorers: {
    default: {
      name: 'Hydration Explorer',
      url: 'https://hydration.subscan.io',
    },
  },
  testnet: false,
});

export const hydration = new EvmParachain({
  assetsData: [
    {
      asset: hdx,
      id: 0,
      xcmLocation: {
        parents: 0,
        interior: 'Here',
      },
    },
    {
      asset: aave,
      decimals: 18,
      id: 1000624,
      min: 0.00006,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
              },
            },
          ],
        },
      },
    },
    {
      asset: aca,
      decimals: 12,
      id: 1000099,
      min: 0.091,
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
      asset: ajun,
      decimals: 12,
      id: 32,
      min: 0.11,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2051,
            },
            {
              GeneralKey: {
                length: 4,
                data: '0x414a554e00000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: astr,
      decimals: 18,
      id: 9,
      min: 0.15,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2006,
          },
        },
      },
    },
    {
      asset: bnc,
      decimals: 12,
      id: 14,
      min: 0.069,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2030,
            },
            {
              GeneralKey: {
                length: 2,
                data: '0x0001000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: cfg,
      decimals: 18,
      id: 13,
      min: 0.033,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2031,
            },
            {
              GeneralKey: {
                length: 2,
                data: '0x0001000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: cru,
      decimals: 12,
      id: 27,
      min: 0.0079,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2008,
          },
        },
      },
    },
    {
      asset: ded,
      decimals: 10,
      id: 1000019,
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
              GeneralIndex: 30,
            },
          ],
        },
      },
    },
    {
      asset: dot,
      decimals: 10,
      id: 5,
      min: 0.0018,
      xcmLocation: {
        parents: 1,
        interior: 'Here',
      },
    },
    {
      asset: dota,
      decimals: 4,
      id: 1000038,
      xcmLocation: {
        parents: '1',
        interior: {
          X3: [
            {
              Parachain: 1000,
            },
            {
              PalletInstance: 50,
            },
            {
              GeneralIndex: 18,
            },
          ],
        },
      },
    },
    {
      asset: dai_awh,
      decimals: 18,
      id: 2,
      min: 0.01,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2000,
            },
            {
              GeneralKey: {
                length: 21,
                data: '0x0254a37a01cd75b616d63e0ab665bffdb0143c52ae0000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: dai_mwh,
      decimals: 18,
      id: 18,
      min: 0.01,
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 2004,
            },
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
      asset: eth,
      decimals: 18,
      id: 34,
      min: 0.0000055,
      xcmLocation: {
        parents: 2,
        interior: {
          X1: {
            GlobalConsensus: {
              Ethereum: {
                chainId: 1,
              },
            },
          },
        },
      },
    },
    {
      asset: glmr,
      decimals: 18,
      id: 16,
      min: 0.035,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2004,
            },
            {
              PalletInstance: 10,
            },
          ],
        },
      },
    },
    {
      asset: ibtc,
      decimals: 8,
      id: 11,
      min: 0.00000036,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2032,
            },
            {
              GeneralKey: {
                length: 2,
                data: '0x0001000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: intr,
      decimals: 10,
      id: 17,
      min: 0.62,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2032,
            },
            {
              GeneralKey: {
                length: 2,
                data: '0x0002000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: kilt,
      decimals: 15,
      id: 28,
      min: 0.022,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2086,
          },
        },
      },
    },
    {
      asset: ewt,
      decimals: 18,
      id: 252525,
      min: 0.022,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: 3345,
          },
        },
      },
    },
    {
      asset: ldo,
      decimals: 18,
      id: 1000796,
      min: 0.013,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
              },
            },
          ],
        },
      },
    },
    {
      asset: ksm,
      decimals: 12,
      id: 1000771,
      min: 0.00035,
      xcmLocation: {
        parents: 2,
        interior: {
          X1: {
            GlobalConsensus: 'Kusama',
          },
        },
      },
    },
    {
      asset: laos,
      decimals: 18,
      id: 3370,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: 3370,
          },
        },
      },
    },
    {
      asset: lbtc,
      decimals: 8,
      id: 1000851,
      min: 0.00000023,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x8236a87084f8b84306f72007f36f2618a5634494',
              },
            },
          ],
        },
      },
    },
    {
      asset: ldot,
      decimals: 10,
      id: 1000100,
      min: 0.011,
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
                data: '0x0003000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: link,
      decimals: 18,
      id: 1000794,
      min: 0.001,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x514910771af9ca656af840dff83e8264ecf986ca',
              },
            },
          ],
        },
      },
    },
    {
      asset: myth,
      decimals: 18,
      id: 30,
      min: 0.022,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: 3369,
          },
        },
      },
    },
    {
      asset: neuro,
      decimals: 12,
      id: 36,
      min: 0.001,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2043,
          },
        },
      },
    },
    {
      asset: nodl,
      decimals: 11,
      id: 26,
      min: 1.1,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2026,
            },
            {
              PalletInstance: 2,
            },
          ],
        },
      },
    },
    {
      asset: pen,
      decimals: 12,
      id: 1000081,
      min: 0.16,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2094,
            },
            {
              PalletInstance: 10,
            },
          ],
        },
      },
    },
    {
      asset: pink,
      decimals: 10,
      id: 1000021,
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
      asset: pha,
      decimals: 12,
      id: 8,
      min: 0.055,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2035,
          },
        },
      },
    },
    {
      asset: ring,
      decimals: 18,
      id: 31,
      min: 1,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2030,
            },
            {
              GeneralKey: {
                length: 2,
                data: '0x0903000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: sky,
      decimals: 18,
      id: 1000795,
      min: 0.52,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x56072c95faa701256059aa122697b133aded9279',
              },
            },
          ],
        },
      },
    },
    {
      asset: sub,
      decimals: 10,
      id: 24,
      min: 0.02,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2101,
          },
        },
      },
    },
    {
      asset: sol,
      decimals: 9,
      id: 1000752,
      min: 0.000047,
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 2004,
            },
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0x99fec54a5ad36d50a4bba3a41cab983a5bb86a7d',
              },
            },
          ],
        },
      },
    },
    {
      asset: sui,
      decimals: 9,
      id: 1000753,
      min: 0.003,
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 2004,
            },
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
      asset: susde,
      decimals: 18,
      id: 1000625,
      min: 0.01,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x9d39a5de30e57443bff2a8307a4256c8797a3497',
              },
            },
          ],
        },
      },
    },
    {
      asset: susds,
      decimals: 18,
      id: 1000626,
      min: 0.01,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0xa3931d71877c0e7a3148cb7eb4463524fec27fbd',
              },
            },
          ],
        },
      },
    },
    {
      asset: susds_mwh,
      decimals: 18,
      id: 1000745,
      min: 0.01,
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 2004,
            },
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
      asset: tbtc,
      decimals: 18,
      id: 1000765,
      min: 0.00000023,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x18084fba666a33d37592fa2633fd49a74dd93a88',
              },
            },
          ],
        },
      },
    },
    {
      asset: trac,
      decimals: 18,
      id: 35,
      min: 0.028,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0xaA7a9CA87d3694B5755f213B5D04094b8d0F0A6F',
              },
            },
          ],
        },
      },
    },
    {
      asset: unq,
      decimals: 18,
      id: 25,
      min: 1.23,
      xcmLocation: {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2037,
          },
        },
      },
    },
    {
      asset: usdc,
      decimals: 6,
      id: 22,
      min: 0.01,
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
      asset: usdc_mwh,
      decimals: 6,
      id: 21,
      min: 0.01,
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 2004,
            },
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0x931715fee2d06333043d11f658c8ce934ac61d0c',
              },
            },
          ],
        },
      },
    },
    {
      asset: usdc_eth,
      decimals: 6,
      id: 1000766,
      min: 0.01,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              },
            },
          ],
        },
      },
    },
    {
      asset: usdt,
      decimals: 6,
      id: 10,
      min: 0.01,
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
    {
      asset: usdt_mwh,
      decimals: 6,
      id: 23,
      min: 0.01,
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 2004,
            },
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0xc30e9ca94cf52f3bf5692aacf81353a27052c46f',
              },
            },
          ],
        },
      },
    },
    {
      asset: usdt_eth,
      decimals: 6,
      id: 1000767,
      min: 0.01,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0xdac17f958d2ee523a2206206994597c13d831ec7',
              },
            },
          ],
        },
      },
    },
    {
      asset: vastr,
      decimals: 18,
      id: 33,
      min: 0.14,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2030,
            },
            {
              GeneralKey: {
                length: 2,
                data: '0x0903000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: vdot,
      decimals: 10,
      id: 15,
      min: 0.0019,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2030,
            },
            {
              GeneralKey: {
                length: 2,
                data: '0x0900000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: wbtc,
      decimals: 8,
      id: 1000190,
      min: 0.00000023,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
              },
            },
          ],
        },
      },
    },
    {
      asset: wbtc_awh,
      decimals: 8,
      id: 3,
      min: 0.00000044,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2000,
            },
            {
              GeneralKey: {
                length: 21,
                data: '0x02c80084af223c8b598536178d9361dc55bfda68180000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: wbtc_mwh,
      decimals: 8,
      id: 19,
      min: 0.00000034,
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 2004,
            },
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0xe57ebd2d67b462e9926e04a8e33f01cd0d64346d',
              },
            },
          ],
        },
      },
    },
    {
      asset: weth,
      decimals: 18,
      id: 1000189,
      min: 0.0000061,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
              },
            },
          ],
        },
      },
    },
    {
      asset: weth_awh,
      decimals: 18,
      id: 4,
      min: 0.000005,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2000,
            },
            {
              GeneralKey: {
                length: 21,
                data: '0x025a4d6acdc4e3e5ab15717f407afe957f7a2425780000000000000000000000',
              },
            },
          ],
        },
      },
    },
    {
      asset: weth_mwh,
      decimals: 18,
      id: 20,
      min: 0.0000054,
      xcmLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 2004,
            },
            {
              PalletInstance: 110,
            },
            {
              AccountKey20: {
                network: null,
                key: '0xab3f0245b83feb11d15aaffefd7ad465a59817ed',
              },
            },
          ],
        },
      },
    },
    {
      asset: wsteth,
      decimals: 18,
      id: 1000809,
      min: 0.00000635,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
              },
            },
          ],
        },
      },
    },
    {
      asset: wud,
      decimals: 10,
      id: 1000085,
      min: 20000,
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
              GeneralIndex: 31337,
            },
          ],
        },
      },
    },
    {
      asset: ztg,
      decimals: 10,
      id: 12,
      min: 0.091,
      xcmLocation: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2092,
            },
            {
              GeneralKey: {
                length: 2,
                data: '0x0001000000000000000000000000000000000000000000000000000000000000',
              },
            },
          ],
        },
      },
    },
  ],
  ecosystem: Ecosystem.Polkadot,
  evmChain: evmChain,
  evmResolver: evmResolver,
  explorer: 'https://hydration.subscan.io',
  genesisHash:
    '0xafdc188f45c71dacbaa0b62e16a91f726c7b8699a9748cdf715459de6b7f366d',
  key: 'hydration',
  name: 'Hydration',
  parachainId: 2034,
  ss58Format: 63,
  ws: rpcWebsocketList,
  rpcs: rpcHttpList,
});
