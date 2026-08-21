import JSBI from 'jsbi';
import { CurrencyAmount, Token } from '@uniswap/sdk-core';
import {
  FeeAmount,
  Pool,
  TICK_SPACINGS,
  TickMath,
  encodeSqrtRatioX96,
  nearestUsableTick,
} from '@uniswap/v3-sdk';

import { UniswapV3Math } from './UniswapV3Math';
import { V3PoolState, V3Tick } from './types';

const CHAIN_ID = 1;
const FEE = FeeAmount.MEDIUM;
const SPACING = TICK_SPACINGS[FEE];

const TOKEN0 = new Token(
  CHAIN_ID,
  '0x0000000000000000000000000000000000000001',
  18,
  'T0'
);
const TOKEN1 = new Token(
  CHAIN_ID,
  '0x0000000000000000000000000000000000000002',
  18,
  'T1'
);

const MIN = nearestUsableTick(TickMath.MIN_TICK, SPACING);
const MAX = nearestUsableTick(TickMath.MAX_TICK, SPACING);

const UNIT = 10n ** 18n;

type Fixture = {
  sqrtPriceX96: JSBI;
  liquidity: bigint;
  ticks: V3Tick[];
};

const fullRange: Fixture = {
  sqrtPriceX96: encodeSqrtRatioX96(1, 1),
  liquidity: UNIT,
  ticks: [
    { index: MIN, liquidityNet: UNIT, liquidityGross: UNIT },
    { index: MAX, liquidityNet: -UNIT, liquidityGross: UNIT },
  ],
};

const multiTick: Fixture = {
  sqrtPriceX96: encodeSqrtRatioX96(1, 1),
  liquidity: 6n * UNIT,
  ticks: [
    { index: MIN, liquidityNet: UNIT, liquidityGross: UNIT },
    { index: -1200, liquidityNet: 5n * UNIT, liquidityGross: 5n * UNIT },
    { index: 600, liquidityNet: 3n * UNIT, liquidityGross: 3n * UNIT },
    { index: 1200, liquidityNet: -5n * UNIT, liquidityGross: 5n * UNIT },
    { index: 3000, liquidityNet: -3n * UNIT, liquidityGross: 3n * UNIT },
    { index: MAX, liquidityNet: -UNIT, liquidityGross: UNIT },
  ],
};

function toState(f: Fixture): V3PoolState {
  return {
    fee: FEE,
    sqrtPriceX96: BigInt(f.sqrtPriceX96.toString()),
    tick: TickMath.getTickAtSqrtRatio(f.sqrtPriceX96),
    liquidity: f.liquidity,
    tickSpacing: SPACING,
    ticks: f.ticks,
  };
}

function toPool(f: Fixture): Pool {
  return new Pool(
    TOKEN0,
    TOKEN1,
    FEE,
    f.sqrtPriceX96.toString(),
    f.liquidity.toString(),
    TickMath.getTickAtSqrtRatio(f.sqrtPriceX96),
    f.ticks.map((t) => ({
      index: t.index,
      liquidityGross: t.liquidityGross.toString(),
      liquidityNet: t.liquidityNet.toString(),
    }))
  );
}

const SELL_AMOUNTS = [UNIT / 1000n, UNIT / 10n, UNIT / 2n, 2n * UNIT];
const BUY_AMOUNTS = [UNIT / 1000n, UNIT / 10n, UNIT / 2n];

describe.each([
  ['full-range', fullRange],
  ['multi-tick', multiTick],
])('UniswapV3Math vs @uniswap/v3-sdk reference (%s)', (_label, fixture) => {
  const state = toState(fixture);
  const pool = toPool(fixture);

  describe.each([true, false])('zeroForOne=%s', (zeroForOne) => {
    const inToken = zeroForOne ? TOKEN0 : TOKEN1;
    const outToken = zeroForOne ? TOKEN1 : TOKEN0;

    it.each(SELL_AMOUNTS)(
      'calculateOutGivenIn reproduces getOutputAmount (amountIn=%s)',
      async (amountIn) => {
        const [expected] = await pool.getOutputAmount(
          CurrencyAmount.fromRawAmount(inToken, amountIn.toString())
        );
        const actual = UniswapV3Math.calculateOutGivenIn(
          state,
          zeroForOne,
          amountIn
        );
        expect(actual.toString()).toBe(expected.quotient.toString());
      }
    );

    it.each(BUY_AMOUNTS)(
      'calculateInGivenOut reproduces getInputAmount (amountOut=%s)',
      async (amountOut) => {
        const [expected] = await pool.getInputAmount(
          CurrencyAmount.fromRawAmount(outToken, amountOut.toString())
        );
        const actual = UniswapV3Math.calculateInGivenOut(
          state,
          zeroForOne,
          amountOut
        );
        expect(actual.toString()).toBe(expected.quotient.toString());
      }
    );
  });
});
