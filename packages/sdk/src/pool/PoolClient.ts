import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise, VoidFn } from '@polkadot/api-base/types';

import { memoize1 } from '@thi.ng/memoize';

import { HYDRADX_OMNIPOOL_ADDRESS } from '../consts';
import { BalanceClient } from '../client';
import { Asset, PoolBase, PoolFees, PoolType } from '../types';
import { BigNumber } from '../utils/bignumber';

export abstract class PoolClient extends BalanceClient {
  protected pools: PoolBase[] = [];
  protected subs: VoidFn[] = [];
  private assets: Map<string, Asset> = new Map([]);

  private memPools = memoize1((x: number) => {
    console.log(this.getPoolType(), 'mem pools', x, '✅');
    return this.getPools();
  });

  constructor(api: ApiPromise) {
    super(api);
  }

  abstract isSupported(): boolean;
  abstract getPoolType(): PoolType;
  abstract getPoolFees(feeAsset: string, address: string): Promise<PoolFees>;
  protected abstract loadPools(): Promise<PoolBase[]>;
  protected abstract subscribePoolChange(pool: PoolBase): UnsubscribePromise;

  get augmentedPools() {
    return this.pools
      .filter((p) => this.isValidPool(p))
      .map((p) => this.withMetadata(p));
  }

  async withAssets(assets: Asset[]) {
    this.assets = new Map(assets.map((asset: Asset) => [asset.id, asset]));
  }

  async getMemPools(): Promise<PoolBase[]> {
    return this.memPools(1);
  }

  async getPools(): Promise<PoolBase[]> {
    console.log(this.getPoolType(), 'getPools', '✅');
    this.pools = await this.loadPools();
    this.subs = await this.subscribe();
    return this.augmentedPools;
  }

  private async subscribe() {
    const subs = this.augmentedPools.map(async (pool: PoolBase) => {
      const poolSubs = [
        await this.subscribePoolChange(pool),
        await this.subscribeSystemPoolBalance(pool),
        await this.subscribeTokensPoolBalance(pool),
      ];

      if (this.hasErc20Asset(pool)) {
        const subErc20 = await this.subscribeErc20PoolBalance(pool);
        poolSubs.push(subErc20);
      }

      if (this.hasShareAsset(pool)) {
        const subShare = await this.subscribeSharePoolBalance(pool);
        poolSubs.push(subShare);
      }

      this.subscribeLog(pool);
      return poolSubs;
    });

    const subsriptions = await Promise.all(subs);
    return subsriptions.flat();
  }

  private hasShareAsset(pool: PoolBase) {
    return pool.type === PoolType.Stable && pool.id;
  }

  private hasErc20Asset(pool: PoolBase) {
    return pool.tokens.some((t) => t.type === 'Erc20');
  }

  unsubscribe() {
    this.subs.forEach((unsub) => {
      unsub();
    });
  }

  private subscribeLog(pool: PoolBase) {
    const poolAddr = pool.address.substring(0, 10).concat('...');
    console.log(`${pool.type} [${poolAddr}] balance subscribed`);
  }

  private subscribeSystemPoolBalance(pool: PoolBase): UnsubscribePromise {
    return this.subscribeSystemBalance(
      pool.address,
      this.updateBalanceCallback(pool)
    );
  }

  private subscribeTokensPoolBalance(pool: PoolBase): UnsubscribePromise {
    /**
     * Skip balance update for shared token in stablepool as balance is
     * stored in omnipool instead
     *
     * @param p - asset pool
     * @param t - pool token
     * @returns true if pool id different than token, otherwise false (shared token)
     */
    const isNotStableswap = (p: PoolBase, t: string) => p.id !== t;
    return this.subscribeTokenBalance(
      pool.address,
      pool.tokens,
      this.updateBalancesCallback(pool, isNotStableswap)
    );
  }

  private subscribeErc20PoolBalance(pool: PoolBase): UnsubscribePromise {
    return this.subscribeErc20Balance(
      pool.address,
      pool.tokens,
      this.updateBalancesCallback(pool, () => true)
    );
  }

  private subscribeSharePoolBalance(pool: PoolBase): UnsubscribePromise {
    const sharedAsset = this.assets.get(pool.id!);
    return this.subscribeTokenBalance(
      HYDRADX_OMNIPOOL_ADDRESS,
      [sharedAsset!],
      this.updateBalancesCallback(pool, () => true)
    );
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

  private updateBalancesCallback(
    pool: PoolBase,
    canUpdate: (pool: PoolBase, token: string) => boolean
  ) {
    return function (balances: [string, BigNumber][]) {
      balances.forEach(([token, balance]) => {
        const tokenIndex = pool.tokens.findIndex((t) => t.id == token);
        if (tokenIndex >= 0 && canUpdate(pool, token)) {
          pool.tokens[tokenIndex].balance = balance.toString();
        }
      });
    };
  }

  private updateBalanceCallback(pool: PoolBase) {
    return function (token: string, balance: BigNumber) {
      const tokenIndex = pool.tokens.findIndex((t) => t.id == token);
      if (tokenIndex >= 0) {
        pool.tokens[tokenIndex].balance = balance.toString();
      }
    };
  }
}
