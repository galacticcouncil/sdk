import { PolkadotClient } from 'polkadot-api';

import { memoize1 } from '@thi.ng/memoize';

import { type Observable, Subscription } from 'rxjs';

import { SYSTEM_ASSET_ID } from '../consts';
import { BalanceClient } from '../client';
import { Asset } from '../types';

import { PoolBase, PoolFees, PoolType } from './types';

export abstract class PoolClient<T extends PoolBase> extends BalanceClient {
  protected pools: PoolBase[] = [];
  protected subs: Subscription = Subscription.EMPTY;

  private assets: Map<number, Asset> = new Map([]);
  private mem: number = 0;

  private memPools = memoize1((mem: number) => {
    console.log(this.getPoolType(), 'mem pools', mem, '✅');
    return this.getPools();
  });

  constructor(client: PolkadotClient) {
    super(client);
  }

  abstract isSupported(): Promise<boolean>;
  abstract getPoolType(): PoolType;
  abstract getPoolFees(address: string, feeAsset: number): Promise<PoolFees>;
  abstract loadPools(): Promise<T[]>;
  abstract subscribePoolChange(pool: T): Observable<T>;

  get augmentedPools() {
    return this.pools
      .filter((p) => this.isValidPool(p))
      .map((p) => this.withMetadata(p));
  }

  /**
   * Update registry assets, evict mempool
   *
   * @param assets - registry assets
   */
  withAssets(assets: Asset[]) {
    this.assets = new Map(assets.map((asset: Asset) => [asset.id, asset]));
    this.mem = this.mem + 1;
  }

  async getPoolsMem(): Promise<PoolBase[]> {
    return this.memPools(this.mem);
  }

  async getPools(): Promise<PoolBase[]> {
    //this.unsubscribe();
    this.pools = await this.loadPools();
    //this.subs = this.subscribe();
    const type = this.getPoolType();
    console.log(type, `pools(${this.augmentedPools.length})`, '✅');
    //console.log(type, `subs(${this.subs.length})`, '✅');

    return this.augmentedPools;
  }

  // private subscribe() {
  //   const subs = this.augmentedPools.map((pool: PoolBase) => {
  //     const poolSubs = [this.subscribeTokensPoolBalance(pool)];

  //     try {
  //       const subChange = this.subscribePoolChange(pool);
  //       poolSubs.push(subChange);
  //     } catch (e) {}

  //     if (this.hasSystemAsset(pool)) {
  //       const subSystem = this.subscribeSystemPoolBalance(pool);
  //       poolSubs.push(subSystem);
  //     }

  //     if (this.hasErc20Asset(pool)) {
  //       const subErc20 = this.subscribeErc20PoolBalance(pool);
  //       poolSubs.push(subErc20);
  //     }

  //     if (this.hasShareAsset(pool)) {
  //       const subShare = this.subscribeSharePoolBalance(pool);
  //       poolSubs.push(subShare);
  //     }

  //     this.subscribeLog(pool);
  //     return poolSubs;
  //   });

  //   return subs.flat();
  // }

  private hasSystemAsset(pool: PoolBase) {
    return pool.tokens.some((t) => t.id === SYSTEM_ASSET_ID);
  }

  private hasShareAsset(pool: PoolBase) {
    return pool.type === PoolType.Stable && pool.id;
  }

  private hasErc20Asset(pool: PoolBase) {
    return pool.tokens.some((t) => t.type === 'Erc20');
  }

  unsubscribe() {
    this.subs.unsubscribe();
  }

  private subscribeLog(pool: PoolBase) {
    const poolAddr = pool.address.substring(0, 10).concat('...');
    console.log(`${pool.type} [${poolAddr}] balance subscribed`);
  }

  // private subscribeSystemPoolBalance(pool: PoolBase): UnsubscribePromise {
  //   return this.subscribeSystemBalance(
  //     pool.address,
  //     this.updateBalanceCallback(pool)
  //   );
  // }

  // private subscribeTokensPoolBalance(
  //   pool: PoolBase
  // ): Observable<AssetAmount[]> {
  //   /**
  //    * Skip balance update for shared token in stablepool as balance is
  //    * stored in omnipool instead
  //    *
  //    * @param p - asset pool
  //    * @param t - pool token
  //    * @returns true if pool id different than token, otherwise false (shared token)
  //    */
  //   const isNotStableswap = (p: PoolBase, t: string) => p.id !== t;
  //   return this.subscribeTokenBalance(
  //     pool.address,
  //     pool.tokens,
  //     this.updateBalancesCallback(pool, isNotStableswap)
  //   );
  // }

  // private subscribeErc20PoolBalance(pool: PoolBase): UnsubscribePromise {
  //   return this.subscribeErc20Balance(
  //     pool.address,
  //     pool.tokens,
  //     this.updateBalancesCallback(pool, () => true)
  //   );
  // }

  // private subscribeSharePoolBalance(pool: PoolBase): UnsubscribePromise {
  //   const sharedAsset = this.assets.get(pool.id!);
  //   return this.subscribeTokenBalance(
  //     HYDRADX_OMNIPOOL_ADDRESS,
  //     [sharedAsset!],
  //     this.updateBalancesCallback(pool, () => true)
  //   );
  // }

  /**
   * Check if pool valid. Only XYK pools are being verified as those are
   * considered permissionless.
   *
   * @param pool - asset pool
   * @returns true if pool valid & assets known by registry, otherwise false
   */
  private isValidPool(pool: PoolBase): boolean {
    return pool.type === PoolType.XYK
      ? pool.tokens.every((t) => this.assets.get(t.id))
      : true;
  }

  /**
   * Augment pool tokens with asset metadata
   *
   * @param pool - asset pool
   * @returns asset pool with augmented tokens
   */
  private withMetadata(pool: PoolBase) {
    pool.tokens = pool.tokens.map((t) => {
      const asset = this.assets.get(t.id);
      return {
        ...t,
        ...asset,
      };
    });
    return pool;
  }

  // private updateBalancesCallback(
  //   pool: PoolBase,
  //   canUpdate: (pool: PoolBase, token: string) => boolean
  // ) {
  //   return function (balances: [string, BigNumber][]) {
  //     balances.forEach(([token, balance]) => {
  //       const tokenIndex = pool.tokens.findIndex((t) => t.id == token);
  //       if (tokenIndex >= 0 && canUpdate(pool, token)) {
  //         pool.tokens[tokenIndex].balance = balance.toString();
  //       }
  //     });
  //   };
  // }

  // private updateBalanceCallback(pool: PoolBase) {
  //   return function (token: string, balance: BigNumber) {
  //     const tokenIndex = pool.tokens.findIndex((t) => t.id == token);
  //     if (tokenIndex >= 0) {
  //       pool.tokens[tokenIndex].balance = balance.toString();
  //     }
  //   };
  // }
}
