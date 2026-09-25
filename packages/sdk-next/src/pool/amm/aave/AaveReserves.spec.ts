import { H160 } from '../../../evm';

import { PoolType } from '../../types';

import { aavePoolId, pairReserves, toAavePool } from './AaveReserves';

/** Hydration mainnet, read from the registry 2026-08-25. */
const HOLLAR = {
  id: 222,
  contract: '0x531a654d1696ed52e7275a8cede955e82620f99a',
};
const ADOT = {
  id: 1001,
  contract: '0x02639ec01313c8775fae74f2dad1118c8a8a86da',
};
/** DOT — `Token`-kind, so the alias IS its address. */
const DOT = { id: 5, alias: '0x0000000000000000000000000000000100000005' };
/** WETH — `Token`-kind, so the alias IS its address. */
const WETH = { id: 20, alias: '0x0000000000000000000000000000000100000014' };
/** aHOLLAR — a contract the registry does not know. */
const UNKNOWN = '0xd7cb2a3ab8a1d4f8c4b1c4f5d3f6b7a8c9d0e1f2';

const byContract = new Map<string, number>([
  [HOLLAR.contract, HOLLAR.id],
  [ADOT.contract, ADOT.id],
]);

const h = (s: string) => s as H160;

describe('pairReserves', () => {
  it('maps an alias reserve to a contract aToken', () => {
    const { pairs, skipped } = pairReserves(
      [h(DOT.alias)],
      new Map([[DOT.alias, h(ADOT.contract)]]),
      byContract
    );
    expect(skipped).toEqual([]);
    expect(pairs).toEqual([
      {
        reserve: DOT.alias,
        atoken: ADOT.contract,
        reserveId: DOT.id,
        atokenId: ADOT.id,
      },
    ]);
  });

  it('maps a contract reserve through the registry index', () => {
    const { pairs } = pairReserves(
      [h(HOLLAR.contract)],
      new Map([[HOLLAR.contract, h(ADOT.contract)]]),
      byContract
    );
    expect(pairs).toEqual([
      {
        reserve: HOLLAR.contract,
        atoken: ADOT.contract,
        reserveId: HOLLAR.id,
        atokenId: ADOT.id,
      },
    ]);
  });

  it('skips a reserve the registry does not know', () => {
    const { pairs, skipped } = pairReserves(
      [h(UNKNOWN), h(DOT.alias)],
      new Map([
        [UNKNOWN, h(ADOT.contract)],
        [DOT.alias, h(ADOT.contract)],
      ]),
      byContract
    );
    expect(pairs.map((p) => p.reserveId)).toEqual([DOT.id]);
    expect(skipped).toEqual([
      { reserve: UNKNOWN, atoken: ADOT.contract, reason: 'reserve' },
    ]);
  });

  it('skips a reserve whose aToken the registry does not know', () => {
    const { pairs, skipped } = pairReserves(
      [h(HOLLAR.contract)],
      new Map([[HOLLAR.contract, h(UNKNOWN)]]),
      byContract
    );
    expect(pairs).toEqual([]);
    expect(skipped).toEqual([
      { reserve: HOLLAR.contract, atoken: UNKNOWN, reason: 'atoken' },
    ]);
  });

  it('skips a reserve with no aToken read', () => {
    const { pairs, skipped } = pairReserves(
      [h(DOT.alias)],
      new Map(),
      byContract
    );
    expect(pairs).toEqual([]);
    expect(skipped).toEqual([
      { reserve: DOT.alias, atoken: undefined, reason: 'atoken' },
    ]);
  });

  it('keeps the pool list order', () => {
    const { pairs } = pairReserves(
      [h(WETH.alias), h(DOT.alias)],
      new Map([
        [WETH.alias, h(ADOT.contract)],
        [DOT.alias, h(ADOT.contract)],
      ]),
      byContract
    );
    expect(pairs.map((p) => p.reserveId)).toEqual([WETH.id, DOT.id]);
  });
});

describe('toAavePool', () => {
  const assets = new Map<number, any>([
    [
      DOT.id,
      {
        decimals: 10,
        existential_deposit: 17_540_000n,
        asset_type: { type: 'Token' },
      },
    ],
    [
      ADOT.id,
      {
        decimals: 10,
        existential_deposit: 17_540_000n,
        asset_type: { type: 'Erc20' },
      },
    ],
  ]);
  const aDotLocation = {
    parents: 0,
    interior: {
      type: 'X1',
      value: { type: 'AccountKey20', value: { key: ADOT.contract } },
    },
  };
  const locations = new Map<number, any>([[ADOT.id, aDotLocation]]);

  it('puts liquidity in on the reserve leg and liquidity out on the aToken leg', () => {
    const pool = toAavePool(
      { reserveId: DOT.id, atokenId: ADOT.id },
      { liqudity_in: 111n, liqudity_out: 222n },
      assets,
      locations
    );
    expect(pool.type).toBe(PoolType.Aave);
    expect(pool.address).toBe(aavePoolId(DOT.id, ADOT.id));
    expect(pool.tokens.map((t) => t.id)).toEqual([DOT.id, ADOT.id]);
    expect(pool.tokens.map((t) => t.balance)).toEqual([111n, 222n]);
  });

  it('carries registry metadata onto each leg', () => {
    const pool = toAavePool(
      { reserveId: DOT.id, atokenId: ADOT.id },
      { liqudity_in: 1n, liqudity_out: 1n },
      assets,
      locations
    );
    const [reserve, atoken] = pool.tokens as any[];
    expect(reserve.decimals).toBe(10);
    expect(reserve.existentialDeposit).toBe(17_540_000n);
    expect(reserve.type).toBe('Token');
    expect(reserve.location).toBeUndefined();
    expect(atoken.type).toBe('Erc20');
    expect(atoken.location).toEqual(aDotLocation);
  });

  it('has no trade limits of its own', () => {
    const pool = toAavePool(
      { reserveId: DOT.id, atokenId: ADOT.id },
      { liqudity_in: 1n, liqudity_out: 1n },
      assets,
      locations
    );
    expect(pool.maxInRatio).toBe(0n);
    expect(pool.maxOutRatio).toBe(0n);
    expect(pool.minTradingLimit).toBe(0n);
  });
});

describe('aavePoolId', () => {
  it('is stable for a pair and distinct across pairs', () => {
    expect(aavePoolId(DOT.id, ADOT.id)).toBe(aavePoolId(DOT.id, ADOT.id));
    expect(aavePoolId(DOT.id, ADOT.id)).not.toBe(aavePoolId(ADOT.id, DOT.id));
  });
});
