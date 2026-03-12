import { PoolBase, PoolFees, PoolPair, PoolType } from '../../types';
import {
  AssetDynamicFee,
  EmaOraclePeriod,
  EmaOracleSource,
  IOfflinePoolServiceDataSource,
  IPersistentConstants,
  IPersistentEmaOracleEntryData,
  IPersistentExtras,
  IPersistentMetaData,
  PersistentAsset,
} from '../types';
import { OfflinePoolUtils } from '../utils/OfflinePoolUtils';

export abstract class OfflinePoolClient {
  protected pools: PoolBase[] = [];
  private assets: Map<string, PersistentAsset> = new Map([]);
  protected constants: IPersistentConstants;
  protected extras: IPersistentExtras;
  protected emaOracleEntries: Map<
    EmaOracleSource,
    Map<EmaOraclePeriod, Map<string, IPersistentEmaOracleEntryData>>
  > = new Map([]);
  protected dataSourceMeta: IPersistentMetaData;

  abstract isSupported(): boolean;
  abstract getPoolType(): PoolType;
  abstract getPoolFees(
    block: number,
    pair: PoolPair,
    address: string
  ): Promise<PoolFees>;

  protected constructor(
    dataSource: IOfflinePoolServiceDataSource,
    poolType: PoolType
  ) {
    this.pools =
      dataSource.pools[poolType.toLowerCase() as keyof typeof dataSource.pools];
    this.constants = dataSource.constants;
    this.dataSourceMeta = dataSource.meta;
    this.extras = dataSource.extras;
    this.emaOracleEntries = OfflinePoolUtils.decorateEmaOraclesPersistentData(
      dataSource.emaOracle
    );
  }

  get augmentedPools() {
    return this.pools.filter((p) => this.isValidPool(p));
  }

  /**
   * Check if pool valid. Only XYK pools are being verified as those are
   * considered permissionless.
   *
   * @param pool - asset pool
   * @returns true if pool valid & assets known by registry, otherwise false
   */
  private isValidPool(pool: PoolBase): boolean {
    return pool.type === PoolType.XYK
      ? pool.tokens.every((t) => this.assets.has(t.id))
      : true;
  }

  getPools(): PoolBase[] {
    return this.augmentedPools;
  }

  /**
   * Update registry assets, evict mempool
   *
   * @param assets - registry assets
   */
  withAssets(assets: PersistentAsset[]) {
    this.assets = new Map(
      assets.map((asset: PersistentAsset) => [asset.id, asset])
    );
  }

  protected getAssetDynamicFee(assetId: string): AssetDynamicFee | undefined {
    if (!this.assets.has(assetId))
      throw Error('Asset not found: ' + assetId + '');
    return this.assets.get(assetId)!.dynamicFee;
  }
}
