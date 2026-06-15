import { UniswapV3PoolClient, ticksInWord } from './UniswapV3PoolClient';

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
