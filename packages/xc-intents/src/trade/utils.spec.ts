import { floorOut, minOrderWeth } from './utils';

const E15 = 10n ** 15n;
const base = { cost: 10n ** 12n, minOrderAmount: 10n ** 11n };
const ceiling = 317n * 10n ** 12n; // 0.000317 ETH
/** nBTC at 0.0282 per ETH, the hard floor 20% under it: sat per 1e18 wei. */
const btcFloor = (2_820_000n * 80n) / 100n;

describe('minOrderWeth', () => {
  it('pays out an order of the least sum even at the floor', () => {
    const least = minOrderWeth(base, ceiling, btcFloor, 6400n);
    expect(floorOut(base, ceiling, btcFloor, least)).toBeGreaterThanOrEqual(
      6400n
    );
    expect(least - base.cost).toBeLessThan(4n * E15);
    expect(least).toBeGreaterThan(3n * E15);
    expect((least - base.cost) % 10n ** 10n).toBe(0n);
  });

  it('is twice the ceiling without a route minimum', () => {
    expect(minOrderWeth(base, ceiling, btcFloor, 0n)).toBe(
      base.cost + 2n * ceiling
    );
  });

  it('is the least order plus a tiny ceiling', () => {
    expect(minOrderWeth(base, 10n ** 10n, 0n, 0n)).toBe(
      base.cost + 11n * 10n ** 10n
    );
  });

  it("can't promise a route minimum without a floor", () => {
    expect(() => minOrderWeth(base, ceiling, 0n, 6400n)).toThrow();
  });
});

describe('floorOut', () => {
  it('is zero when the order does not cover cost and ceiling', () => {
    expect(floorOut(base, ceiling, btcFloor, base.cost)).toBe(0n);
    expect(floorOut(base, ceiling, btcFloor, base.cost + ceiling)).toBe(0n);
  });

  it('falls short of the route just under the least order', () => {
    const least = minOrderWeth(base, ceiling, btcFloor, 6400n);
    const under = least - 2n * 10n ** 10n;
    expect(floorOut(base, ceiling, btcFloor, under)).toBeLessThan(6400n);
  });
});
