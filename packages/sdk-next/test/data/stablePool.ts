import { AssetType, pool } from '../../src';

const { PoolType } = pool;

const token: AssetType = 'Token';
const erc20: AssetType = 'Erc20';

export const stablePool690 = {
  type: PoolType.Stable,
  address: '7Ni2vDQ41AMCzx8pBpNvL3CtrkprAaAB73NzyJy6T17PaGHo',
  tokens: [
    {
      id: 15,
      decimals: 10,
      existentialDeposit: 18761726n,
      balance: 53460393478010905n,
      tradeable: 10,
      type: token,
    },
    {
      id: 1001,
      decimals: 10,
      existentialDeposit: 54125333n,
      balance: 31494627272198826n,
      tradeable: 15,
      type: erc20,
    },
    {
      id: 690,
      tradeable: 15,
      balance: 11066828539143258997674657n,
      decimals: 18,
    },
  ],
  maxInRatio: 0n,
  maxOutRatio: 0n,
  minTradingLimit: 1000n,
  amplification: 222n,
  isRampPeriod: false,
  id: 690,
  fee: [690, 1000000],
  totalIssuance: 11066828539143258997674657n,
  pegs: [
    [
      '256034301020995972702313815175317743062',
      '160755528687381171259253341571428671805',
    ],
    ['1', '1'],
  ],
};

export const stablePool111 = {
  type: PoolType.Stable,
  address: '7MGtw1k9uxVBbJcBoTaqVdPWiNSNqND472ZbGuZPGtBYRb5i',
  tokens: [
    {
      id: 222,
      decimals: 18,
      existentialDeposit: 20000000000000000n,
      balance: 2709678003785775223254711n,
      tradeable: 15,
      type: erc20,
    },
    {
      id: 1002,
      decimals: 6,
      existentialDeposit: 22409n,
      balance: 2563299894833n,
      tradeable: 15,
      type: erc20,
    },
    {
      id: 111,
      tradeable: 15,
      balance: 5239867444887484778463198n,
      decimals: 18,
    },
  ],
  maxInRatio: 0n,
  maxOutRatio: 0n,
  minTradingLimit: 1000n,
  amplification: 222n,
  isRampPeriod: false,
  id: 111,
  fee: [200, 1000000],
  totalIssuance: 5239867444887484778463198n,
  pegs: [
    ['1', '1'],
    ['1', '1'],
  ],
};

export const stablePool100 = {
  type: PoolType.Stable,
  address: '7JP6TvcH5x31TsbC6qVJHEhsW7UNmpREMZuLBpK2bG1goJRS',
  tokens: [
    {
      id: 10,
      decimals: 6,
      existentialDeposit: 10000n,
      balance: 24365717660n,
      tradeable: 15,
      type: token,
    },
    {
      id: 18,
      decimals: 18,
      existentialDeposit: 10000000000000000n,
      balance: 23105642035795644872538n,
      tradeable: 15,
      type: token,
    },
    {
      id: 21,
      decimals: 6,
      existentialDeposit: 10000n,
      balance: 16890444069n,
      tradeable: 15,
      type: token,
    },
    {
      id: 23,
      decimals: 6,
      existentialDeposit: 10000n,
      balance: 19531216613n,
      tradeable: 15,
      type: token,
    },
    {
      id: 100,
      tradeable: 15,
      balance: 80527560907963479482415n,
      decimals: 18,
    },
  ],
  maxInRatio: 0n,
  maxOutRatio: 0n,
  minTradingLimit: 1000n,
  amplification: 320n,
  isRampPeriod: false,
  id: 100,
  fee: [200, 1000000],
  totalIssuance: 80527560907963479482415n,
  pegs: [
    ['1', '1'],
    ['1', '1'],
    ['1', '1'],
    ['1', '1'],
  ],
};
