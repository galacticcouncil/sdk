import { getNodesAndEdges } from '../../src/suggester';
import { PoolBase } from '../../src/types';
import { xykPools } from '../data/xykPools';
import { xykPools as xykPoolsDev } from '../data/xykPoolsDev';

describe('Suggester graph utility', () => {
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

describe('Suggester graph utility DEV', () => {
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
