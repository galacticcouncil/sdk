import { Pool, PoolService } from "../types";

export class Router {
  private pools: Pool[] = [];
  private readonly poolService: PoolService;

  /**
   * @param {PoolService} poolService - Fetch pool data
   */
  constructor(poolService: PoolService) {
    this.poolService = poolService;
  }
}
