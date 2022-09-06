import { Bfs, Path, Edge } from '../../src/suggester';
import { getNodesAndEdges } from '../../src/suggester';
import { stablePools } from '../data/stablePools';

describe('Suggester Breadth First Search algorithm', () => {
  const g: Path[] = [];
  const size = 4;

  beforeEach(() => {
    for (let j = 0; j < size; j++) {
      g.push([]);
    }

    g[0].push([2, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq']);
    g[0].push([1, 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ']);
    g[1].push([2, 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3']);
    g[1].push([0, 'bXn6KCrv8k2JV7B2c5jzLttBDqL4BurPCTcLa3NQk5SWDVXCJ']);
    g[2].push([0, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq']);
    g[2].push([1, 'bXi1mHNp4jSRUNXuX3sY1fjCF9Um2EezkpzkFmQuLHaChdPM3']);
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

describe('Suggester Breadth First Search algorithm from node-edges', () => {
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
      [
        [1, ''],
        [0, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
        [2, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
      ],
      [
        [1, ''],
        [3, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
        [2, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
      ],
      [
        [1, ''],
        [0, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
        [3, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
        [2, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
      ],
      [
        [1, ''],
        [3, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
        [0, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
        [2, 'bXjT2D2cuxUuP2JzddMxYusg4cKo3wENje5Xdk3jbNwtRvStq'],
      ],
    ]);
  });
});
