import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api-base/types';

import { memoize1 } from '@thi.ng/memoize';
import { TLRUCache } from '@thi.ng/cache';

import { BalanceClient } from '../client';
import { EvmClient } from '../evm';
import { MmOracleClient } from '../mm';
import { Asset } from '../types';
import { BigNumber } from '../utils/bignumber';

import { PoolBase, PoolFees, PoolPair, PoolType } from './types';

export abstract class PoolClient extends BalanceClient {
  protected evm: EvmClient;
  protected mmOracle: MmOracleClient;

  protected pools: PoolBase[] = [];
  protected subs: UnsubscribePromise[] = [];

  private assets: Map<string, Asset> = new Map([]);
  private mem: number = 0;

  private memPoolsCache = new TLRUCache<number, Promise<PoolBase[]>>(null, {
    maxlen: 1,
    ttl: 1 * 60 * 60 * 1000,
    release: (mem) => {
      if (this.mem > mem) {
        this.log(this.getPoolType(), `mem ${mem} released at`, new Date());
      }
    },
  });

  private memPools = memoize1((mem: number) => {
    this.log(this.getPoolType(), `mem ${mem} sync`);
    return this.getPools();
  }, this.memPoolsCache);

  constructor(api: ApiPromise, evm: EvmClient) {
    super(api);
    this.evm = evm;
    this.mmOracle = new MmOracleClient(evm);
  }

  abstract isSupported(): boolean;
  abstract getPoolType(): PoolType;
  abstract getPoolFees(poolPair: PoolPair, address: string): Promise<PoolFees>;
  protected abstract loadPools(): Promise<PoolBase[]>;
  protected abstract subscribePoolChange(pool: PoolBase): UnsubscribePromise;

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
  async withAssets(assets: Asset[]) {
    this.assets = new Map(assets.map((asset: Asset) => [asset.id, asset]));
    this.mem = this.mem + 1;
  }

  async getPoolsMem(): Promise<PoolBase[]> {
    return await this.memPools(this.mem);
  }

  async getPools(): Promise<PoolBase[]> {
    this.unsubscribe();
    this.pools = await this.loadPools();
    this.subs = this.subscribe();
    const type = this.getPoolType();
    this.log(type, `mem ${this.mem} pools(${this.augmentedPools.length})`);
    this.log(type, `mem ${this.mem} subs(${this.subs.length})`);
    return this.augmentedPools;
  }

  private subscribe() {
    const subs = this.augmentedPools.map((pool: PoolBase) => {
      const poolSubs = [];

      try {
        const subChange = this.subscribePoolChange(pool);
        poolSubs.push(subChange);
      } catch (e) {}

      if (pool.type === PoolType.Aave) {
        return poolSubs;
      }

      const tokenSub = this.subscribeTokensPoolBalance(pool);
      poolSubs.push(tokenSub);

      if (this.hasSystemAsset(pool)) {
        const subSystem = this.subscribeSystemPoolBalance(pool);
        poolSubs.push(subSystem);
      }

      if (this.hasErc20Asset(pool)) {
        const subErc20 = this.subscribeErc20PoolBalance(pool);
        poolSubs.push(subErc20);
      }

      this.subscribeLog(pool);
      return poolSubs;
    });

    return subs.flat();
  }

  private hasSystemAsset(pool: PoolBase) {
    return pool.tokens.some((t) => t.id === '0');
  }

  private hasErc20Asset(pool: PoolBase) {
    return pool.tokens.some((t) => t.type === 'Erc20');
  }

  unsubscribe() {
    this.subs.forEach((unsub) => {
      unsub.then((fn) => fn());
    });
  }

  private subscribeLog(pool: PoolBase) {
    const poolAddr = pool.address.substring(0, 10).concat('...');
    this.log(`${pool.type} mem ${this.mem} [${poolAddr}] balance subscribed`);
  }

  private subscribeSystemPoolBalance(pool: PoolBase): UnsubscribePromise {
    return this.subscribeSystemBalance(
      pool.address,
      this.updateBalanceCallback(pool)
    );
  }

  private subscribeTokensPoolBalance(pool: PoolBase): UnsubscribePromise {
    /**
     * Skip balance update for shared token in stablepool
     *
     * @param p - asset pool
     * @param t - pool token
     * @returns true if pool id different than token, otherwise false (shared token)
     */
    const isNotStableswap = (p: PoolBase, t: string) => p.id !== t;
    return this.subscribeTokenBalance(
      pool.address,
      this.updateBalancesCallback(pool, isNotStableswap)
    );
  }

  private subscribeErc20PoolBalance(pool: PoolBase): UnsubscribePromise {
    const ids = pool.tokens.filter((t) => t.type === 'Erc20').map((t) => t.id);
    return this.subscribeErc20Balance(
      pool.address,
      this.updateBalancesCallback(pool, () => true),
      ids
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
