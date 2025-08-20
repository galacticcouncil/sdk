import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { Vec } from '@polkadot/types';
import { FrameSystemEventRecord } from '@polkadot/types/lookup';

import { memoize1 } from '@thi.ng/memoize';
import { TLRUCache } from '@thi.ng/cache';

import { BalanceClient } from '../client';
import { EvmClient } from '../evm';
import { MmOracleClient } from '../oracle';
import { Asset } from '../types';

import { PoolBase, PoolFees, PoolPair, PoolType } from './types';

export abstract class PoolClient extends BalanceClient {
  protected evm: EvmClient;
  protected mmOracle: MmOracleClient;

  protected pools: PoolBase[] = [];
  protected subs: UnsubscribePromise[] = [];

  protected assets: Map<string, Asset> = new Map([]);
  protected mem: number = 0;

  readonly onNewBlockHandler: (block: number) => void;
  readonly onEventsHandler: (events: Vec<FrameSystemEventRecord>) => void;

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
    this.onNewBlockHandler = this.onNewBlock.bind(this);
    this.onEventsHandler = this.onEvents.bind(this);
  }

  protected onNewBlock(_block: number): void {}
  protected onEvents(_events: Vec<FrameSystemEventRecord>): void {}

  abstract isSupported(): boolean;
  abstract getPoolType(): PoolType;
  abstract getPoolFees(
    block: number,
    pair: PoolPair,
    address: string
  ): Promise<PoolFees>;
  protected abstract loadPools(): Promise<PoolBase[]>;
  protected abstract subscribeUpdates(): UnsubscribePromise;

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
    const balanceSubs = this.subscribeBalances();
    const updatesSubs = this.subscribeUpdates();

    this.subs.push(balanceSubs);
    this.subs.push(updatesSubs);

    const type = this.getPoolType();
    this.log(type, `mem ${this.mem} pools(${this.augmentedPools.length})`);
    this.log(type, `mem ${this.mem} subs(${this.subs.length})`);
    return this.augmentedPools;
  }

  protected async subscribeBalances(): UnsubscribePromise {
    const unsub = this.augmentedPools.map(async (pool: PoolBase) => {
      const unsubFns = [];

      const tokenSub = await this.subscribeTokensPoolBalance(pool);
      unsubFns.push(tokenSub);

      if (this.hasSystemAsset(pool)) {
        const subSystem = await this.subscribeSystemPoolBalance(pool);
        unsubFns.push(subSystem);
      }

      if (this.hasErc20Asset(pool)) {
        const subErc20 = await this.subscribeErc20PoolBalance(pool);
        unsubFns.push(subErc20);
      }

      this.subscribeLog(pool);
      return unsubFns;
    });

    const unsubFns = await Promise.all(unsub);

    return () => {
      for (const unsub of unsubFns.flat()) {
        try {
          unsub();
        } catch (e) {
          console.warn('Balance unsub failed', e);
        }
      }
    };
  }

  private hasSystemAsset(pool: PoolBase) {
    return pool.tokens.some((t) => t.id === '0');
  }

  private hasErc20Asset(pool: PoolBase) {
    return pool.tokens.some((t) => t.type === 'Erc20');
  }

  unsubscribe() {
    this.subs.forEach((unsub) => {
      unsub.then((fn) => fn()).catch((e) => console.warn('Unsub failed', e));
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
