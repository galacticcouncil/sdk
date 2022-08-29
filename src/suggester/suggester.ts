import { PoolBase } from "../types";
import { Bfs, Node, Path } from "./bfs";

import { getNodesAndEdges, Edge } from "./graph";

export class RouteSuggester {
  /**
   * Proposals are ideal paths from tokenIn to tokenOut calculated from all
   * permutations of tokens of given pool.
   *
   * E.g. permutation of pool A={1,3} is 2, such as {1,3}, {3,1} where 1 are 3
   * are pool assets(tokens)
   *
   * Filtering of valid paths and corresponding asset pairs is done by router itself!!!
   *
   * @param tokenIn - tokenIn
   * @param tokenOut - tokenOut
   * @param pools - substrate based pools
   * @returns all posible path proposals from tokenIn to tokenOut
   */
  getProposals(tokenIn: string, tokenOut: string, pools: PoolBase[]): Edge[][] {
    const nodeEdges = getNodesAndEdges(pools);
    const tokensToSwap = Object.keys(nodeEdges);
    const possibleSwaps: Edge[] = tokensToSwap.map((node) => nodeEdges[node]).flat();

    const bfs = new Bfs();
    const possibleSwapsGraph = bfs.buildAndPopulateGraph(tokensToSwap, possibleSwaps);
    const possiblePaths = bfs.findPaths(possibleSwapsGraph, parseInt(tokenIn), parseInt(tokenOut));
    return this.parsePaths(possiblePaths);
  }

  private parsePaths(possiblePaths: Path[]): Edge[][] {
    const paths: Edge[][] = [];
    for (const path of possiblePaths) {
      const edges: Edge[] = [];
      for (let i = 0; i < path.length; i++) {
        const from = path[i];
        const to = path[i + 1];
        if (to === undefined) {
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
    return [to[1], from[0].toString(), to[0].toString()] as Edge;
  }
}
