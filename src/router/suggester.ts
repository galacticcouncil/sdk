import { Hop, PoolBase } from "../types";
import { Bfs, node } from "./bfs";

import { getNodesAndEdges, Edge } from "./filtering";

export class RouteSuggester {
  getProposals(tokenIn: string, tokenOut: string, pools: PoolBase[]): Hop[][] {
    const nodeEdges = getNodesAndEdges(pools);
    const tokensToSwaps = Object.keys(nodeEdges);
    const possibleSwaps: Edge[] = tokensToSwaps.map((node) => nodeEdges[node]).flat();

    const bfs = new Bfs();
    const possibleSwapsGraph = bfs.buildAndPopulateGraph(tokensToSwaps, possibleSwaps);
    const possiblePaths = bfs.findPaths(possibleSwapsGraph, parseInt(tokenIn), parseInt(tokenOut));

    const poolById = new Map<string, PoolBase>(pools.map((i) => [i.address, i]));
    return this.parseHops(possiblePaths, poolById);
  }

  private toHop(from: node, to: node, pool: PoolBase | undefined): Hop {
    return {
      poolId: to[1],
      poolType: pool?.type,
      tokenIn: from[0].toString(),
      tokenOut: to[0].toString(),
      fee: pool?.swapFee,
    } as Hop;
  }

  private parseHops(possiblePaths: node[][], poolById: Map<string, PoolBase>): Hop[][] {
    const paths: Hop[][] = [];
    for (const path of possiblePaths) {
      const hops: Hop[] = [];
      for (let i = 0; i < path.length; i++) {
        const from = path[i];
        const to = path[i + 1];
        if (to === undefined) {
          break;
        } else {
          const poolId = to[1];
          hops.push(this.toHop(from, to, poolById.get(poolId)));
        }
      }
      paths.push(hops);
    }
    return paths;
  }
}
