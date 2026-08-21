import { UniswapV3PoolClient } from './UniswapV3PoolClient';
import { ticksInWord, windowWords } from './UniswapV3Query';

describe('Uniswap V3 Pool Client', () => {
  it('Should expose the client class', () => {
    expect(typeof UniswapV3PoolClient).toBe('function');
  });

  it('Should decode initialized ticks from a positive bitmap word', () => {
    const bitmap = (1n << 20n) | (1n << 200n);
    expect(ticksInWord(bitmap, 0, 10)).toEqual([200, 2000]);
  });

  it('Should decode initialized ticks from a negative bitmap word', () => {
    const bitmap = 1n << 56n;
    expect(ticksInWord(bitmap, -1, 10)).toEqual([-2000]);
  });

  it('Should return no ticks for an empty word', () => {
    expect(ticksInWord(0n, 3, 60)).toEqual([]);
  });

  it('Should scale tick indices by tick spacing', () => {
    const bitmap = 1n << 5n;
    expect(ticksInWord(bitmap, 0, 60)).toEqual([300]);
  });
});

describe('windowWords', () => {
  it('keeps coverage comparable across fee tiers', () => {
    // A fixed word count would give spacing 60 ~2000x the price range of
    // spacing 1. Sizing from a tick target brings them within an order.
    const wide = windowWords(60);
    const tight = windowWords(10);
    expect(wide.covers).toBeGreaterThan(20_000);
    expect(tight.covers).toBeGreaterThan(20_000);
    expect(wide.capped).toBe(false);
    expect(tight.capped).toBe(false);
  });

  it('reads fewer words at wide spacing than the old fixed 5', () => {
    expect(windowWords(60).words).toBeLessThan(5);
  });

  it('reports when the cap binds instead of truncating silently', () => {
    const s1 = windowWords(1);
    expect(s1.capped).toBe(true);
    // Still materially wider than the old fixed 5 words (±1280 ticks).
    expect(s1.covers).toBeGreaterThan(1_280);
  });

  it('never asks for zero words', () => {
    expect(windowWords(200).words).toBeGreaterThanOrEqual(1);
  });
});
