import { PoolAsset } from "../../types";

/**
 * XYK Pallet
 *
 * @see https://galacticcouncil.github.io/api-docs/
 */
export interface XykClient {
  /**
   * Get asset pairs in a pool
   */
  getPoolAssets(): Promise<PoolAsset[]>;

  /**
   * Get current exchange fee
   */
  getExchangeFee(): number;

  /**
   * System account balance
   *
   * @param accountId - account id
   */
  getSystemAccountBalance(accountId: string): Promise<string>;

  /**
   * Token account balance
   *
   * @param accountId - account id
   * @param tokenKey - token asset key
   */
  getTokenAccountBalance(accountId: string, tokenKey: string): Promise<string>;

  getAssetMetadata(tokenKey: string): string | Promise<string>;
}
