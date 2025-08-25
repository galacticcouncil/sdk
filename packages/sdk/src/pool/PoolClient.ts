import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { Vec } from '@polkadot/types';
import { FrameSystemEventRecord } from '@polkadot/types/lookup';

import { memoize1 } from '@thi.ng/memoize';
import { TLRUCache } from '@thi.ng/cache';

import { SYSTEM_ASSET_ID } from '../consts';
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
    return this.memPools(this.mem);
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
    const systemQueries: string[] = [];
    const tokenQueries: string[][] = [];
    const erc20Queries: string[][] = [];

    const unsubFns: (() => void)[] = [];

    for (const pool of this.augmentedPools) {
      const { address, tokens } = pool;

      tokens
        .filter((t) => t.id === SYSTEM_ASSET_ID)
        .forEach(() => {
          systemQueries.push(address);
        });

      tokens
        .filter(
          (t) =>
            t.type === 'Token' && t.id !== SYSTEM_ASSET_ID && t.id !== pool.id
        )
        .forEach((t) => {
          tokenQueries.push([address, t.id]);
        });

      tokens
        .filter((t) => t.type === 'Erc20')
        .forEach((t) => {
          erc20Queries.push([address, t.id]);
        });
    }

    const updateBalancesSysCallback = (balances: [string, BigNumber][]) => {
      balances.forEach(([query, balance]) => {
        const pool = this.pools.find((p) => p.address === query);
        if (pool) {
          const tokenIndex = pool.tokens.findIndex(
            (t) => t.id === SYSTEM_ASSET_ID
          );
          pool.tokens[tokenIndex].balance = balance.toString();
        }
      });
    };

    const updateBalancesCallback = (balances: [string[], BigNumber][]) => {
      balances.forEach(([query, balance]) => {
        const [address, asset] = query;
        const pool = this.pools.find((p) => p.address === address);
        if (pool) {
          const tokenIndex = pool.tokens.findIndex((t) => t.id === asset);
          pool.tokens[tokenIndex].balance = balance.toString();
        }
      });
    };

    if (systemQueries.length > 0) {
      const systemSub = await this.subscribeSystemBalances(
        systemQueries,
        updateBalancesSysCallback
      );
      unsubFns.push(systemSub);
    }

    if (tokenQueries.length > 0) {
      const tokenSub = await this.subscribeTokenBalances(
        tokenQueries,
        updateBalancesCallback
      );
      unsubFns.push(tokenSub);
    }

    if (erc20Queries.length > 0) {
      const erc20Sub = await this.subscribeErc20Balances(
        erc20Queries,
        updateBalancesCallback
      );
      unsubFns.push(erc20Sub);
    }

    return () => {
      for (const unsub of unsubFns) {
        try {
          unsub();
        } catch (e) {
          console.warn('Balance unsub failed', e);
        }
      }
    };
  }

  unsubscribe() {
    this.subs.forEach((unsub) => {
      unsub.then((fn) => fn()).catch((e) => console.warn('Unsub failed', e));
    });
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
}
