import { Bfs, Node, Path } from './bfs';
import { getNodesAndEdges, Edge } from './graph';

import { PoolBase } from '../../pool';

export class RouteSuggester {
  /**
   * Proposals are ideal paths from
   * 1) tokenIn to tokenOut
   * 2) tokenIn to *(all possible paths are requested)
   *
   * calculated from all permutations of tokens of given pools.
   *
   * E.g. permutation of pool A={1,3} is 2, such as {1,3}, {3,1} where 1 are 3
   * are pool assets(tokens)
   *
   * Filtering of valid paths and corresponding asset pairs is done by router itself!!!
   *
   * @param tokenIn - tokenIn
   * @param tokenOut - tokenOut or null if all possible paths from tokenIn are requested
   * @param pools - substrate based pools
   * @returns all possible path proposals
   */
  getProposals(
    tokenIn: number,
    tokenOut: number | null,
    pools: PoolBase[]
  ): Edge[][] {
    const nodeEdges = getNodesAndEdges(pools);
    const poolAssets = Object.keys(nodeEdges);
    const possiblePairs: Edge[] = poolAssets
      .map((node) => nodeEdges[node])
      .flat();
    const bfs = new Bfs();
    const bfsGraph = bfs.buildAndPopulateGraph(poolAssets, possiblePairs);
    const possiblePaths = bfs.findPaths(bfsGraph, tokenIn, tokenOut);
    return this.parsePaths(possiblePaths);
  }

  private parsePaths(possiblePaths: Path[]): Edge[][] {
    const paths: Edge[][] = [];
    for (const path of possiblePaths) {
      const edges: Edge[] = [];
      for (let i = 0; i < path.length; i++) {
        const from = path[i];
        const to = path[i + 1];
        if (to == null) {
          break;
        } else {
          edges.push(this.toEdge(from, to));
        }
      }
      paths.push(edges);
    }
    return paths;
  }

  private toEdge(from: Node, to: Node): Edge {
    return [to[1], from[0], to[0]] as Edge;
  }
}
