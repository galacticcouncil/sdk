import { PoolFactory } from '../PoolFactory';
import { PoolType } from '../types';

import { UniswapV3Math } from './UniswapV3Math';
import { UniswapV3Pool } from './UniswapV3Pool';
import { UniswapV3PoolBase, V3PoolState } from './types';

const UNIT = 10n ** 18n;
const Q96 = 2n ** 96n;
const MIN_TICK = -887220;
const MAX_TICK = 887220;

const NET = { fee: [3000, 1_000_000] } as any;

function base(overrides: Partial<UniswapV3PoolBase> = {}): UniswapV3PoolBase {
  return {
    address: '0xpool',
    type: PoolType.V3,
    tokens: [
      {
        id: 1,
        balance: 100n * UNIT,
        decimals: 18,
        existentialDeposit: 0n,
        type: 'Token',
      },
      {
        id: 2,
        balance: 100n * UNIT,
        decimals: 18,
        existentialDeposit: 0n,
        type: 'Token',
      },
    ],
    maxInRatio: 3n,
    maxOutRatio: 3n,
    minTradingLimit: 1n,
    fee: 3000,
    token0: 1,
    token1: 2,
    sqrtPriceX96: Q96,
    tick: 0,
    liquidity: 10n * UNIT,
    tickSpacing: 60,
    ticks: [
      { index: MIN_TICK, liquidityNet: 10n * UNIT, liquidityGross: 10n * UNIT },
      { index: MAX_TICK, liquidityNet: -10n * UNIT, liquidityGross: 10n * UNIT },
    ],
    ...overrides,
  };
}

function state(pool: UniswapV3PoolBase): V3PoolState {
  return {
    fee: pool.fee,
    sqrtPriceX96: pool.sqrtPriceX96,
    tick: pool.tick,
    liquidity: pool.liquidity,
    tickSpacing: pool.tickSpacing,
    ticks: pool.ticks,
  };
}

describe('Uniswap V3 Pool', () => {
  it('Should be built by PoolFactory for type UniswapV3', () => {
    const pool = PoolFactory.get(base());
    expect(pool).toBeInstanceOf(UniswapV3Pool);
    expect(pool.type).toBe(PoolType.V3);
  });

  it('Should validate only the two pool tokens', () => {
    const pool = UniswapV3Pool.fromPool(base());
    expect(pool.validatePair(1, 2)).toBe(true);
    expect(pool.validatePair(2, 1)).toBe(true);
    expect(pool.validatePair(1, 3)).toBe(false);
    expect(pool.validatePair(1, 1)).toBe(false);
  });

  it('Should delegate sell with zeroForOne true when input is token0', () => {
    const b = base();
    const pool = UniswapV3Pool.fromPool(b);
    const actual = pool.calculateOutGivenIn(pool.parsePair(1, 2), UNIT, NET);
    expect(actual).toBe(UniswapV3Math.calculateOutGivenIn(state(b), true, UNIT));
    expect(actual).toBeGreaterThan(0n);
  });

  it('Should delegate sell with zeroForOne false when input is token1', () => {
    const b = base();
    const pool = UniswapV3Pool.fromPool(b);
    const actual = pool.calculateOutGivenIn(pool.parsePair(2, 1), UNIT, NET);
    expect(actual).toBe(UniswapV3Math.calculateOutGivenIn(state(b), false, UNIT));
  });

  it('Should report gross output, net output and effective fee on sell', () => {
    const pool = UniswapV3Pool.fromPool(base());
    const pair = pool.parsePair(1, 2);
    const ctx = pool.validateAndSell(pair, UNIT, null);
    expect(ctx.calculatedOut).toBe(pool.calculateOutGivenIn(pair, UNIT));
    expect(ctx.amountOut).toBe(pool.calculateOutGivenIn(pair, UNIT, NET));
    expect(ctx.amountOut < ctx.calculatedOut).toBe(true);
    expect(ctx.feePct).toBeCloseTo(0.3, 1);
  });

  it('Should report gross input, net input and effective fee on buy', () => {
    const pool = UniswapV3Pool.fromPool(base());
    const pair = pool.parsePair(1, 2);
    const ctx = pool.validateAndBuy(pair, UNIT / 2n, null);
    expect(ctx.calculatedIn).toBe(pool.calculateInGivenOut(pair, UNIT / 2n));
    expect(ctx.amountIn).toBe(pool.calculateInGivenOut(pair, UNIT / 2n, NET));
    expect(ctx.amountIn > ctx.calculatedIn).toBe(true);
    expect(ctx.feePct).toBeCloseTo(0.3, 1);
  });

  it('Should return unit spot in both directions for a 1:1 pool', () => {
    const pool = UniswapV3Pool.fromPool(base());
    const pair = pool.parsePair(1, 2);
    expect(pool.spotPriceOutGivenIn(pair)).toBe(UNIT);
    expect(pool.spotPriceInGivenOut(pair)).toBe(UNIT);
  });

  it('Should orient spot price when token1 per token0 is four', () => {
    const pool = UniswapV3Pool.fromPool(base({ sqrtPriceX96: 2n ** 97n }));
    const pair = pool.parsePair(1, 2);
    expect(pool.spotPriceOutGivenIn(pair)).toBe(4n * UNIT);
    expect(pool.spotPriceInGivenOut(pair)).toBe(UNIT / 4n);
  });
});
