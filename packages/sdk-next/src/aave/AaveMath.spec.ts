import {
  INVALID_HF,
  accrueBalance,
  isBorrowingAny,
  isUsingAsCollateral,
  maxWithdraw,
  projectHealthFactor,
  toHealthFactor,
  toRef,
} from './AaveMath';
import { AaveMarketReserve, AaveMarketSummary } from './types';

/** 2 decimals, price 1: one whole token (100 native) is worth 1 reference unit */
const reserve = (over: Partial<AaveMarketReserve> = {}): AaveMarketReserve => ({
  aToken: '0x00000000000000000000000000000000000000a1',
  aTokenId: 1001,
  underlying: '0x0000000000000000000000000000000100000005',
  underlyingId: 5,
  aTokenBalance: 100_000n,
  availableLiquidity: 1_000_000n,
  decimals: 2,
  priceInRef: 1n,
  liquidationThreshold: 0.8,
  isCollateral: true,
  isCollateralOnSupply: true,
  ...over,
});

const summary = (over: Partial<AaveMarketSummary> = {}): AaveMarketSummary => ({
  market: {
    pool: '0x00000000000000000000000000000000000000b1',
    provider: '0x00000000000000000000000000000000000000c1',
    tradeable: true,
  },
  healthFactor: 2,
  currentLiquidationThreshold: 0.8,
  totalCollateral: 2_500n,
  totalDebt: 1_000n,
  reserves: [],
  ...over,
});

describe('user configuration', () => {
  // reserve 0 borrowed (bit 0), reserve 3 used as collateral (bit 7)
  const config = (1n << 0n) | (1n << 7n);

  it('reads the borrowing bits', () => {
    expect(isBorrowingAny(config)).toBe(true);
    expect(isBorrowingAny(1n << 7n)).toBe(false);
  });

  it('reads one reserve collateral bit', () => {
    expect(isUsingAsCollateral(config, 3)).toBe(true);
    expect(isUsingAsCollateral(config, 0)).toBe(false);
  });
});

describe('toHealthFactor', () => {
  it('reports INVALID_HF without debt', () => {
    expect(toHealthFactor(0n, 2n ** 256n - 1n)).toBe(INVALID_HF);
  });

  it('decodes the wad health factor', () => {
    expect(toHealthFactor(1_000n, 1_234_567_000_000_000_000n)).toBe(1.234567);
  });
});

describe('accrueBalance', () => {
  const RAY = 10n ** 27n;

  it('keeps the indexed balance when no time passed', () => {
    expect(accrueBalance(1_000n, 2n * RAY, RAY / 10n, 100, 100)).toBe(2_000n);
  });

  it('accrues supply interest linearly', () => {
    const year = 31536000;
    // 10% a year over a full year on index 1.0
    expect(accrueBalance(1_000n, RAY, RAY / 10n, 0, year)).toBe(1_100n);
  });
});

describe('toRef', () => {
  it('values a native amount in reference units', () => {
    expect(toRef(250n, 100n, 2)).toBe(250n);
  });
});

describe('projectHealthFactor', () => {
  it('reports INVALID_HF without debt', () => {
    const s = summary({ totalDebt: 0n });
    expect(projectHealthFactor(s, [{ reserve: reserve(), amount: -1n }])).toBe(
      INVALID_HF
    );
  });

  it('returns the current health factor for no change', () => {
    expect(projectHealthFactor(summary({ healthFactor: 1.234567 }), [])).toBe(
      1.234567
    );
  });

  it('lowers it by the withdrawn collateral x LT / debt', () => {
    // 250 ref x 0.8 / 1000 debt = 0.2
    const hf = projectHealthFactor(summary(), [
      { reserve: reserve(), amount: -25_000n },
    ]);
    expect(hf).toBe(1.8);
  });

  it('ignores a withdraw of non-collateral', () => {
    const hf = projectHealthFactor(summary(), [
      { reserve: reserve({ isCollateral: false }), amount: -25_000n },
    ]);
    expect(hf).toBe(2);
  });

  it('raises it on a supply that becomes collateral', () => {
    const hf = projectHealthFactor(summary(), [
      { reserve: reserve({ aTokenBalance: 0n }), amount: 25_000n },
    ]);
    expect(hf).toBe(2.2);
  });

  it('ignores a supply that stays out of collateral', () => {
    const hf = projectHealthFactor(summary(), [
      {
        reserve: reserve({ aTokenBalance: 0n, isCollateralOnSupply: false }),
        amount: 25_000n,
      },
    ]);
    expect(hf).toBe(2);
  });

  it('nets both legs of a same-market swap', () => {
    const hf = projectHealthFactor(summary(), [
      { reserve: reserve(), amount: -25_000n },
      {
        reserve: reserve({ liquidationThreshold: 0.5 }),
        amount: 25_000n,
      },
    ]);
    // -0.2 + 0.125
    expect(hf).toBe(1.925);
  });

  it('floors at zero once collateral is gone', () => {
    const hf = projectHealthFactor(summary(), [
      { reserve: reserve(), amount: -10_000_000n },
    ]);
    expect(hf).toBe(0);
  });
});

describe('maxWithdraw', () => {
  it('allows the whole balance of non-collateral', () => {
    const r = reserve({ isCollateral: false });
    expect(maxWithdraw(summary(), r).amount).toBe(100_000n);
  });

  it('caps collateral so the health factor stays at 1.01', () => {
    // (2.01 - 1.01) x 1000 / 0.5 = 2000 ref = 200000 native
    const s = summary({ healthFactor: 2.01 });
    const r = reserve({ liquidationThreshold: 0.5, aTokenBalance: 1_000_000n });
    expect(maxWithdraw(s, r)).toEqual({ amount: 200_000n, decimals: 2 });
  });

  it('allows nothing below the target health factor', () => {
    const s = summary({ healthFactor: 1.005 });
    expect(maxWithdraw(s, reserve()).amount).toBe(0n);
  });

  it('caps at the available liquidity', () => {
    const r = reserve({ isCollateral: false, availableLiquidity: 7n });
    expect(maxWithdraw(summary(), r).amount).toBe(7n);
  });

  it('caps at the free balance of a lockable aToken', () => {
    const r = reserve({ isCollateral: false });
    expect(maxWithdraw(summary(), r, 42n).amount).toBe(42n);
  });
});
