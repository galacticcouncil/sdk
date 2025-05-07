import { Bfs, Path } from './bfs';
import { Edge, getNodesAndEdges } from './graph';

import { stablePools } from '../../../test/data';

describe('Bfs graph', () => {
  const g: Map<number, Path> = new Map();
  const size = 4;

  beforeEach(() => {
    for (let j = 0; j < size; j++) {
      g.set(j, []);
    }

    g.get(0)!.push([2, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq']);
    g.get(0)!.push([1, 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ']);
    g.get(1)!.push([2, 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3']);
    g.get(1)!.push([0, 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ']);
    g.get(2)!.push([0, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq']);
    g.get(2)!.push([1, 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3']);
  });

  it('Should find all possible paths from node 1 to node 2 with edge type', () => {
    const result = new Bfs().findPaths(g, 1, 2);
    expect(result).toStrictEqual([
      [
        [1, ''],
        [2, 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3'],
      ],
      [
        [1, ''],
        [0, 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ'],
        [2, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
      ],
    ]);
  });
});

describe('Bfs graph created from node-edges', () => {
  let bfs: Bfs;

  beforeEach(() => {
    bfs = new Bfs();
  });

  it('Should find all possible paths from node 1 to node 2 with edge type', () => {
    const nodeEdges = getNodesAndEdges(stablePools);
    const poolAssets = Object.keys(nodeEdges);
    const possiblePairs: Edge[] = poolAssets
      .map((node) => nodeEdges[node])
      .flat();
    const graph = bfs.buildAndPopulateGraph(poolAssets, possiblePairs);
    const result = bfs.findPaths(graph, 1, 2);
    expect(result).toStrictEqual([
      [
        [1, ''],
        [2, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
      ],
      [
        [1, ''],
        [2, 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3'],
      ],
    ]);
  });
});
