import { RouteSuggester } from './suggester';

import { PoolBase } from '../../pool';
import { xykPools } from '../../../test/data';

describe('Suggester proposals for XYK pool', () => {
  let pools: PoolBase[];
  let suggester: RouteSuggester;

  beforeEach(() => {
    pools = xykPools;
    suggester = new RouteSuggester();
  });

  it('Should return suggested hops from token 1 to 2', () => {
    expect(pools).toBeDefined();
    const result = suggester.getProposals(1, 2, pools);
    expect(result).toStrictEqual([
      [['bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3', 1, 2]],
      [
        ['bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ', 1, 0],
        ['bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq', 0, 2],
      ],
    ]);
  });
});
