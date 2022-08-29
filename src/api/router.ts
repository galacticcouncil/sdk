import { PoolService, PoolBase, Hop, Pool, Router } from "../types";
import { RouteSuggester } from "../suggester/suggester";
import { Edge } from "../suggester/graph";
import * as PoolFactory from "../pool/poolFactory";

export class TradeRouter implements Router {
  private readonly routeSuggester: RouteSuggester;
  private readonly poolService: PoolService;

  /**
   * @param {PoolService} poolService - Fetch pool data from substrate based pools
   */
  constructor(poolService: PoolService) {
    this.poolService = poolService;
    this.routeSuggester = new RouteSuggester();
  }

  getPools(): Promise<PoolBase[]> {
    return this.poolService.getPools();
  }

  async getAllPaths(tokenIn: string, tokenOut: string): Promise<Hop[][]> {
    const pools = await this.poolService.getPools();
    if (pools.length === 0) return [];

    const poolsMap = new Map<string, Pool>(pools.map((i) => [i.address, PoolFactory.get(i)]));
    return this.getPaths(tokenIn, tokenOut, poolsMap, pools);
  }

  private getPaths(
    tokenIn: string,
    tokenOut: string,
    poolsMap: Map<string, Pool>,
    pools: PoolBase[]
  ): Hop[][] {
    const routeProposals = this.routeSuggester.getProposals(tokenIn, tokenOut, pools);
    const routes = routeProposals
      .filter((path: Edge[]) => {
        return path
          .map((edge: Edge) => this.validEdge(edge, poolsMap))
          .reduce((prev, curr) => prev && curr);
      })
      .map((path: Edge[]) => path.map((edge: Edge) => this.toHop(edge, poolsMap)));
    return routes;
  }

  private validEdge([id, from, to]: Edge, poolsMap: Map<string, Pool>): boolean {
    return poolsMap.get(id)?.validPair(from, to) || false;
  }

  private toHop([id, from, to]: Edge, poolsMap: Map<string, Pool>): Hop {
    const pool = poolsMap.get(id);
    return {
      poolId: id,
      poolType: pool?.type,
      tokenIn: from,
      tokenOut: to,
      fee: pool?.swapFee,
    } as Hop;
  }
}
