import { Bfs, Node, Path } from './bfs';
import { getNodesAndEdges, Edge } from './graph';

import { PoolBase, PoolType } from '../../pool';

export type RouteProposal = Edge[];

export class RouteSuggester {
  /**
   * Returns ideal path proposals from `tokenIn` to `tokenOut`
   * based on BFS over trusted, isolated or both pools.
   *
   * - Trusted pools = all pools except XYK (isolated)
   *
   * The routing strategy is:
   * - If neither `tokenIn` and `tokenOut` is in a trusted pool:
   *   → Run BFS over isolated pools only, searching for all paths.
   * - If both `tokenIn` and `tokenOut` are in trusted pools:
   *   → Run BFS over trusted pools only, searching for shortest paths.
   * - Otherwise:
   *   → Run BFS over all relevant pools (trusted + isolated).
   *
   * This strategy minimizes search scope while ensuring all viable
   * paths are discovered.
   *
   * NOTE: Filtering of valid swaps and pair execution is handled by the router,
   * not in this step.
   *
   * @param tokenIn - The starting token (asset ID as string)
   * @param tokenOut - The destination token (asset ID as string)
   * @param pools - The list of available pools
   * @returns Array of path proposals (each path is a list of edges)
   */
  getProposals(
    tokenIn: string,
    tokenOut: string,
    pools: PoolBase[]
  ): RouteProposal[] {
    const isolatedPools = pools.filter((p) => p.type === PoolType.XYK);
    const trustedPools = pools.filter((p) => p.type !== PoolType.XYK);

    const tokenInId = parseInt(tokenIn);
    const tokenOutId = parseInt(tokenOut);

    const trustedSet = new Set(
      trustedPools
        .map((p) => p.tokens)
        .flat()
        .map((t) => t.id)
    );

    const tokenInTrusted = trustedSet.has(tokenIn);
    const tokenOutTrusted = trustedSet.has(tokenOut);

    const bfs = new Bfs();
    const buildGraphFromPools = (inputPools: PoolBase[]) => {
      const nodeEdges = getNodesAndEdges(inputPools);
      const assets = Object.keys(nodeEdges);
      const routes: Edge[] = assets.flatMap((node) => nodeEdges[node]);
      return bfs.buildAndPopulateGraph(assets, routes);
    };

    // Case 1: Isolated-only
    if (!tokenInTrusted && !tokenOutTrusted) {
      const relevantIsolatedPools = isolatedPools.filter(
        (p) =>
          p.tokens.find((t) => t.id === tokenIn) ||
          p.tokens.find((t) => t.id === tokenOut)
      );
      const graph = buildGraphFromPools(relevantIsolatedPools);
      const paths = bfs.findPaths(graph, tokenInId, tokenOutId);
      return this.parsePaths(paths);
    }

    // Case 2: Trusted-only
    if (tokenInTrusted && tokenOutTrusted) {
      const graph = buildGraphFromPools(trustedPools);
      const paths = bfs.findPaths(graph, tokenInId, tokenOutId);
      return this.parsePaths(paths);
    }

    // Case 3: Mixed (isolated <-> trusted)
    const isolatedOnlyToken = tokenInTrusted ? tokenOut : tokenIn;
    const relevantIsolatedPools = isolatedPools.filter((p) =>
      p.tokens.some((t) => t.id === isolatedOnlyToken)
    );

    if (relevantIsolatedPools.length === 0) {
      return [];
    }

    const relevantPools = [...trustedPools, ...relevantIsolatedPools];
    const graph = buildGraphFromPools(relevantPools);
    const paths = bfs.findPaths(graph, tokenInId, tokenOutId);
    return this.parsePaths(paths);
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
    return [to[1], from[0].toString(), to[0].toString()] as Edge;
  }
}
