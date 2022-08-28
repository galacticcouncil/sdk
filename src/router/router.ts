import { PoolService, PoolBase, Hop } from "../types";
import { RouteSuggester } from "./suggester";

export class Router {
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
    return this.routeSuggester.getProposals(tokenIn, tokenOut, pools);
  }
}
