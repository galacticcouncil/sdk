import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise, VoidFn } from '@polkadot/api-base/types';

import { HYDRADX_OMNIPOOL_ADDRESS } from '../consts';
import { BalanceClient } from '../client';
import { Asset, Pool, PoolBase, PoolFees, PoolType } from '../types';
import { BigNumber } from '../utils/bignumber';

export abstract class PoolClient extends BalanceClient {
  protected pools: PoolBase[] = [];
  protected subs: VoidFn[] = [];
  private loaded = false;
  private assets: Map<string, Asset> = new Map([]);

  constructor(api: ApiPromise) {
    super(api);
  }

  abstract isSupported(): boolean;
  abstract getPoolType(): PoolType;
  abstract getPoolFees(feeAsset: string, address: string): Promise<PoolFees>;
  protected abstract loadPools(): Promise<PoolBase[]>;
  protected abstract subscribePoolChange(pool: PoolBase): UnsubscribePromise;

  async withAssets(assets: Asset[]) {
    this.assets = new Map(assets.map((asset: Asset) => [asset.id, asset]));
  }

  async getPools(): Promise<PoolBase[]> {
    if (this.loaded) {
      return this.pools;
    }
    this.pools = await this.loadPools();
    this.subs = await this.subscribe();
    this.loaded = true;
    return this.pools;
  }

  private async subscribe() {
    const subs = this.pools
      .map((p) => this.augmentTokens(p))
      .map(async (pool: PoolBase) => {
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

  private subscribeLog(pool: PoolBase) {
    const poolAddr = pool.address.substring(0, 10).concat('...');
    console.log(`${pool.type} [${poolAddr}] balance subscribed`);
  }

  unsubscribe() {
    this.subs.forEach((unsub) => {
      unsub();
    });
  }

  private hasShareAsset(pool: PoolBase) {
    return pool.type === PoolType.Stable && pool.id;
  }

  private hasErc20Asset(pool: PoolBase) {
    return pool.tokens.some((t) => t.type === 'Erc20');
  }

  private subscribeSystemPoolBalance(pool: PoolBase): UnsubscribePromise {
    return this.subscribeSystemBalance(
      pool.address,
      this.updateBalanceCallback(pool, () => true)
    );
  }

  private subscribeTokensPoolBalance(pool: PoolBase): UnsubscribePromise {
    const isNotStableswap = (p: PoolBase, t: string) => p.id !== t;
    return this.subscribeTokenBalance(
      pool.address,
      pool.tokens,
      this.updateBalanceCallback(pool, isNotStableswap)
    );
  }

  private subscribeErc20PoolBalance(pool: PoolBase): UnsubscribePromise {
    return this.subscribeErc20Balance(
      pool.address,
      pool.tokens,
      this.updateBalanceCallback(pool, () => true)
    );
  }

  private subscribeSharePoolBalance(pool: PoolBase): UnsubscribePromise {
    const sharedAsset = this.assets.get(pool.id!);
    return this.subscribeTokenBalance(
      HYDRADX_OMNIPOOL_ADDRESS,
      [sharedAsset!],
      this.updateBalanceCallback(pool, () => true)
    );
  }

  /**
   * Augment pool tokens with registry metadata
   *
   * In case of XYK pool we check if every asset is properly registered, if not
   *
   * @param pool - pool
   * @returns - pool with augmented token metadata
   */
  private augmentTokens(pool: PoolBase) {
    const isValidPool =
      pool.type === PoolType.XYK
        ? pool.tokens.every((t) => this.assets.get(t.id))
        : true;

    if (isValidPool) {
      pool.tokens = pool.tokens.map((t) => {
        const asset = this.assets.get(t.id);
        return {
          ...t,
          ...asset,
        };
      });
    }

    return pool;
  }

  private updateBalanceCallback(
    pool: PoolBase,
    canUpdate: (pool: PoolBase, token: string) => boolean
  ) {
    return function (token: string, balance: BigNumber) {
      const tokenIndex = pool.tokens.findIndex((t) => t.id == token);
      if (tokenIndex >= 0 && canUpdate(pool, token)) {
        pool.tokens[tokenIndex].balance = balance.toString();
      }
    };
  }
}
