import {
  ChainEcosystem as Ecosystem,
  EvmParachain,
  SubstrateBalanceType,
} from '@galacticcouncil/xc-core';

import { defineChain, Chain } from 'viem';

import {
  aave,
  ajun,
  apyusd,
  astr,
  bnc,
  cfg_new,
  cru,
  dai_wh,
  dot,
  ena,
  eth,
  eurc_wh,
  ewt,
  glmr,
  hdx,
  ibtc,
  intr,
  jito_sol,
  ksm,
  ldo,
  link,
  myth,
  paxg,
  pen,
  prime,
  neuro,
  sui,
  trac,
  unq,
  usdc,
  usdc_wh,
  usdc_eth,
  usdt,
  usdt_wh,
  usdt_eth,
  vastr,
  vdot,
  wbtc,
  wbtc_wh,
  weth,
  weth_wh,
  wsteth,
  wud,
  susde,
  susds,
  susds_wh,
  sol,
  sky,
  tbtc,
  lbtc,
} from '../../assets';
import { HydrationEvmResolver } from '../../resolvers';

const evmResolver = new HydrationEvmResolver();

const rpcHttpList = [
  'https://hydration-rpc.n.dwellir.com',
  'https://rpc.kril.hydration.cloud',
  'https://hydration.rotko.net',
  'https://rpc.sin.hydration.cloud',
  'https://rpc.coke.hydration.cloud',
];

const rpcWebsocketList = [
  'wss://hydration-rpc.n.dwellir.com',
  'wss://rpc.kril.hydration.cloud',
  'wss://hydration.rotko.net',
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
        interior: {
          X1: [
            {
              GeneralIndex: 0,
            },
          ],
        },
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
                  chain_id: 1,
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
      asset: cfg_new,
      decimals: 18,
      id: 41,
      min: 0.1,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chain_id: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0xcccccccccc33d538dbc2ee4feab0a7a1ff4e8a94',
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
      asset: dai_wh,
      decimals: 18,
      id: 18,
      min: 0.01,
      xcmLocation: {
        parents: 0,
        interior: {
          X3: [
            {
              GeneralKey: {
                length: 2,
                data: '0x7768000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralIndex: 2,
            },
            {
              GeneralKey: {
                length: 32,
                data: '0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f',
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
                chain_id: 1,
              },
            },
          },
        },
      },
    },
    {
      asset: apyusd,
      decimals: 18,
      id: 46,
      min: 0.0147058823529412,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chain_id: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x38eeb52f0771140d10c4e9a9a72349a329fe8a6a',
              },
            },
          ],
        },
      },
    },
    {
      asset: ena,
      decimals: 18,
      id: 38,
      min: 0.037,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chain_id: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x57e114b691db790c35207b2e685d4a43181e6061',
              },
            },
          ],
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
      asset: jito_sol,
      decimals: 9,
      id: 40,
      min: 0.0000027,
      xcmLocation: {
        parents: 0,
        interior: {
          X3: [
            {
              GeneralKey: {
                length: 2,
                data: '0x7768000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralIndex: 1,
            },
            {
              GeneralKey: {
                length: 32,
                data: '0xfcd141e9832caf10ad917495ca0f271b5b293cd47027ea737007ed40eb39a0bd',
              },
            },
          ],
        },
      },
    },
    {
      asset: prime,
      decimals: 6,
      id: 43,
      min: 0.01,
      xcmLocation: {
        parents: 0,
        interior: {
          X3: [
            {
              GeneralKey: {
                length: 2,
                data: '0x7768000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralIndex: 1,
            },
            {
              GeneralKey: {
                length: 32,
                data: '0x26759f460ee5f743ed66d27c8f2a5623bf39d53ed575955320661e6e13e0e3da',
              },
            },
          ],
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
                  chain_id: 1,
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
                  chain_id: 1,
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
                  chain_id: 1,
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
      asset: paxg,
      decimals: 18,
      id: 39,
      min: 0.000005,
      xcmLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chain_id: 1,
                },
              },
            },
            {
              AccountKey20: {
                network: null,
                key: '0x45804880de22913dafe09f4980848ece6ecbaf78',
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
          X2: [
            {
              Parachain: 2043,
            },
            {
              PalletInstance: 10,
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
                  chain_id: 1,
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
      asset: sol,
      decimals: 9,
      id: 1000752,
      min: 0.000047,
      xcmLocation: {
        parents: 0,
        interior: {
          X3: [
            {
              GeneralKey: {
                length: 2,
                data: '0x7768000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralIndex: 1,
            },
            {
              GeneralKey: {
                length: 32,
                data: '0x069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f00000000001',
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
        parents: 0,
        interior: {
          X3: [
            {
              GeneralKey: {
                length: 2,
                data: '0x7768000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralIndex: 21,
            },
            {
              GeneralKey: {
                length: 32,
                data: '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3',
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
                  chain_id: 1,
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
                  chain_id: 1,
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
      asset: susds_wh,
      decimals: 18,
      id: 1000745,
      min: 0.01,
      xcmLocation: {
        parents: 0,
        interior: {
          X3: [
            {
              GeneralKey: {
                length: 2,
                data: '0x7768000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralIndex: 2,
            },
            {
              GeneralKey: {
                length: 32,
                data: '0x000000000000000000000000a3931d71877c0e7a3148cb7eb4463524fec27fbd',
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
                  chain_id: 1,
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
                  chain_id: 1,
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
      asset: usdc_wh,
      decimals: 6,
      id: 21,
      min: 0.01,
      xcmLocation: {
        parents: 0,
        interior: {
          X3: [
            {
              GeneralKey: {
                length: 2,
                data: '0x7768000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralIndex: 2,
            },
            {
              GeneralKey: {
                length: 32,
                data: '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              },
            },
          ],
        },
      },
    },
    {
      asset: eurc_wh,
      decimals: 6,
      id: 44,
      min: 0.014,
      xcmLocation: {
        parents: 0,
        interior: {
          X3: [
            {
              GeneralKey: {
                length: 2,
                data: '0x7768000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralIndex: 30,
            },
            {
              GeneralKey: {
                length: 32,
                data: '0x00000000000000000000000060a3e35cc302bfa44cb288bc5a4f316fdb1adb42',
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
                  chain_id: 1,
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
      asset: usdt_wh,
      decimals: 6,
      id: 23,
      min: 0.01,
      xcmLocation: {
        parents: 0,
        interior: {
          X3: [
            {
              GeneralKey: {
                length: 2,
                data: '0x7768000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralIndex: 2,
            },
            {
              GeneralKey: {
                length: 32,
                data: '0x000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7',
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
                  chain_id: 1,
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
                  chain_id: 1,
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
      asset: wbtc_wh,
      decimals: 8,
      id: 19,
      min: 0.00000034,
      xcmLocation: {
        parents: 0,
        interior: {
          X3: [
            {
              GeneralKey: {
                length: 2,
                data: '0x7768000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralIndex: 2,
            },
            {
              GeneralKey: {
                length: 32,
                data: '0x0000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599',
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
                  chain_id: 1,
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
      asset: weth_wh,
      decimals: 18,
      id: 20,
      min: 0.0000054,
      xcmLocation: {
        parents: 0,
        interior: {
          X3: [
            {
              GeneralKey: {
                length: 2,
                data: '0x7768000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              GeneralIndex: 2,
            },
            {
              GeneralKey: {
                length: 32,
                data: '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
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
                  chain_id: 1,
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
  ],
  balance: SubstrateBalanceType.Tokens,
  balanceOverrides: {
    [hdx.key]: SubstrateBalanceType.System,
  },
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
  wormhole: {
    id: 73,
    coreBridge: '0x3792a6d63c31941B2805181771795D9176fA82A1',
    executor: '0xd633d8d1ceee8c8252196d44857c0f41b8dcb0d9',
    nttExecutor: '0xd3Dda7c8608Ea251C42c6E0A2A686aDc5e9C0C03',
    // Burning managers - token is the erc20 precompile of the asset id.
    ntt: {
      [dai_wh.key]: {
        token: '0x0000000000000000000000000000000100000012',
        manager: '0xcFd576F88C90844AEBF45378Fd09931281D8b14d',
        transceiver: {
          wormhole: '0xe8660CA48f6f4D98BC48DB7Dd07C1a8E555801eA',
        },
      },
      [eurc_wh.key]: {
        token: '0x000000000000000000000000000000010000002C',
        manager: '0x8dd1286A29dF5a2785FB638d6fB1598144Cfbc4C',
        transceiver: {
          wormhole: '0x2e84fac378D67Dc2e11026fB4919E80263a87375',
        },
      },
      [jito_sol.key]: {
        token: '0x0000000000000000000000000000000100000028',
        manager: '0xcE73C15B9ED02413066DE5B904A36F8e8f9B5331',
        transceiver: {
          wormhole: '0xF38D9C3bA6999Dc331b32B416083Fd7e02D17B04',
        },
      },
      [prime.key]: {
        token: '0x000000000000000000000000000000010000002B',
        manager: '0xFCaF4aA069C565d25539028970703F01e47D3E0B',
        transceiver: {
          wormhole: '0x4e7b1E55D2354d4Dc6ABD876096Dc201de0541D1',
        },
      },
      [sol.key]: {
        token: '0x00000000000000000000000000000001000F4530',
        manager: '0x9e200C0f28D92D296b201D96C8269d3CAFFfA9FF',
        transceiver: {
          wormhole: '0x2F04AcF249091425d51e67EeA3C3161ccE283202',
        },
      },
      [sui.key]: {
        token: '0x00000000000000000000000000000001000F4531',
        manager: '0x978443f00cAB6b09445140321EC73a221ebFF5F8',
        transceiver: {
          wormhole: '0xA224D6f4e0E276b34D91bfE6c3A5fE6838322AF7',
        },
      },
      [susds_wh.key]: {
        token: '0x00000000000000000000000000000001000F4529',
        manager: '0x1973E7044d9A7C7bB2d6ea1693A296a9e4B7E448',
        transceiver: {
          wormhole: '0x68Ecadd7934D4FcFEABAfB209C95D379B96400cb',
        },
      },
      [usdc_wh.key]: {
        token: '0x0000000000000000000000000000000100000015',
        manager: '0xEcEab64542A875C4472671D9Ed1E690cdD4e28fC',
        transceiver: {
          wormhole: '0x0d7488B39AA64468a709eC3b3d354DeFE539eD97',
        },
      },
      [usdt_wh.key]: {
        token: '0x0000000000000000000000000000000100000017',
        manager: '0x5E6C488103b47F804824AE15861638af4C436795',
        transceiver: {
          wormhole: '0xd2a16B736F32Df7C0DE72838837656FE0f85Ac0F',
        },
      },
      [wbtc_wh.key]: {
        token: '0x0000000000000000000000000000000100000013',
        manager: '0x6BFca089916c045b0Ca4A09B655aF9F926189993',
        transceiver: {
          wormhole: '0x9a8a1ab288f6749Ce5626DEE1B5d59441BdC187F',
        },
      },
      [weth_wh.key]: {
        token: '0x0000000000000000000000000000000100000014',
        manager: '0xB5cEf790D52A57fa619eD96eDd64c5328F3DCFb7',
        transceiver: {
          wormhole: '0x8acce9CA511d5D7213F8C3f813B8916087cd00ae',
        },
      },
    },
  },
  ws: rpcWebsocketList,
  rpcs: rpcHttpList,
});
