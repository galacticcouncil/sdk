import { PoolBase } from "../types";

export type Edge = [string, string, string];

export type NodeEdges = {
  [node: string]: Edge[];
};

export type Hops = Edge[];

/**
 * Calculate nodes & edges from substrate pools
 *
 * @param pools - given substrate pools
 * @returns nodes & corresponding edges
 */
export function getNodesAndEdges(pools: PoolBase[]): NodeEdges {
  const edgesFromNode: NodeEdges = {};
  for (const pool of pools) {
    const n = pool.tokens.length;
    for (let i = 0; i < n; i++) {
      if (!edgesFromNode[pool.tokens[i].id]) {
        edgesFromNode[pool.tokens[i].id] = [];
      }
      for (let j = 0; j < n; j++) {
        if (i == j) continue;
        const edge: Edge = [pool.address, pool.tokens[i].id, pool.tokens[j].id];
        edgesFromNode[pool.tokens[i].id].push(edge);
      }
    }
  }
  return edgesFromNode;
}
