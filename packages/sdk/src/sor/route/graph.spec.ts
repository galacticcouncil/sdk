import { getNodesAndEdges } from './graph';

import { PoolBase } from '../../pool';
import { stablePools, xykPools, xykPoolsDev } from '../../../test/data';

describe('Suggester graph for XYK pool', () => {
  let pools: PoolBase[];

  beforeEach(() => {
    pools = xykPools;
  });

  it('Should be map of nodes & bidirectional edges', () => {
    expect(pools).toBeDefined();
    const result = getNodesAndEdges(pools);
    expect(result).toStrictEqual({
      '0': [
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '0', '2'],
        ['bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ', '0', '1'],
      ],
      '1': [
        ['bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3', '1', '2'],
        ['bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ', '1', '0'],
      ],
      '2': [
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '2', '0'],
        ['bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3', '2', '1'],
      ],
    });
  });
});

describe('Suggester graph for XYK pool - (DEV)', () => {
  let pools: PoolBase[];

  beforeEach(() => {
    pools = xykPoolsDev;
  });

  it('Should be map of nodes & bidirectional edges', () => {
    expect(pools).toBeDefined();
    const result = getNodesAndEdges(pools);
    expect(result).toStrictEqual({
      '0': [
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '0', '2'],
        ['bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ', '0', '1'],
      ],
      '1': [
        ['bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3', '1', '2'],
        ['bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ', '1', '0'],
      ],
      '2': [
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '2', '0'],
        ['bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3', '2', '1'],
        ['bXmKSSACEp9rm8NuUAyDHiW2AjcLzZ4pvuRczz2ZJNkWVqFFm', '2', '3'],
      ],
      '3': [['bXmKSSACEp9rm8NuUAyDHiW2AjcLzZ4pvuRczz2ZJNkWVqFFm', '3', '2']],
    });
  });
});

describe('Suggester graph for Stable pool', () => {
  let pools: PoolBase[];

  beforeEach(() => {
    pools = stablePools;
  });

  it('Should be map of nodes & bidirectional edges', () => {
    expect(pools).toBeDefined();
    const result = getNodesAndEdges(pools);
    expect(result).toStrictEqual({
      '0': [
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '0', '1'],
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '0', '2'],
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '0', '3'],
      ],
      '1': [
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '1', '0'],
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '1', '2'],
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '1', '3'],
        ['bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3', '1', '2'],
      ],
      '2': [
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '2', '0'],
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '2', '1'],
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '2', '3'],
        ['bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3', '2', '1'],
      ],
      '3': [
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '3', '0'],
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '3', '1'],
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', '3', '2'],
      ],
    });
  });
});
