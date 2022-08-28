import { PoolBase, PoolToken } from "../../types";

/**
 * XYK Pallet
 *
 * @see https://galacticcouncil.github.io/api-docs/
 */
export interface XykClient {
  /**
   * Get available pools
   */
  getPools(): Promise<PoolBase[]>;
}
