import { PoolBase } from "../types";

interface edgeDict {
  [node: string]: [string, string, string][];
}

export function getNodesAndEdges(pools: PoolBase[]): edgeDict {
  const edgesFromNode: edgeDict = {};
  for (const pool of pools) {
    const n = pool.tokens.length;
    for (let i = 0; i < n; i++) {
      if (!edgesFromNode[pool.tokens[i].id]) edgesFromNode[pool.tokens[i].id] = [];
      for (let j = 0; j < n; j++) {
        if (i == j) continue;
        const edge: [string, string, string] = [pool.address, pool.tokens[i].id, pool.tokens[j].id];
        edgesFromNode[pool.tokens[i].id].push(edge);
      }
    }
  }
  return edgesFromNode;
}
