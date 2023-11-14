import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise, VoidFn } from '@polkadot/api-base/types';
import { HYDRADX_OMNIPOOL_ADDRESS } from '../consts';
import { PoolBase, PoolFees, PoolType } from '../types';
import { BigNumber } from '../utils/bignumber';

import { BalanceClient } from '../client';

export abstract class PoolClient extends BalanceClient {
  protected pools: PoolBase[] = [];
  protected subs: VoidFn[] = [];
  private poolsLoaded = false;

  constructor(api: ApiPromise) {
    super(api);
  }

  protected abstract loadPools(): Promise<PoolBase[]>;
  abstract getPoolType(): PoolType;
  abstract getPoolFees(feeAsset: string, address: string): Promise<PoolFees>;
  protected abstract subscribePoolChange(pool: PoolBase): UnsubscribePromise;

  async getPools(): Promise<PoolBase[]> {
    if (this.poolsLoaded) {
      return this.pools;
    }
    console.time(`Load ${this.getPoolType()}`);
    this.pools = await this.loadPools();
    const subscriptions = this.pools.map(
      async (pool) => await this.getPoolSubscriptions(pool)
    );
    const subs = await Promise.all(subscriptions);
    this.subs = subs.flat();
    this.poolsLoaded = true;
    console.timeEnd(`Load ${this.getPoolType()}`);
    return this.pools;
  }

  unsubscribe() {
    this.subs.forEach((unsub) => {
      unsub();
    });
  }

  private async getPoolSubscriptions(pool: PoolBase) {
    const subs = [
      await this.subscribePoolChange(pool),
      await this.subscribeTokenBalance(
        pool.address,
        pool.tokens.map((t) => t.id),
        this.updateBalanceCallback(pool, 'token', (p, t) => p.id !== t)
      ),
      await this.subscribeSystemBalance(
        pool.address,
        this.updateBalanceCallback(pool, 'system', () => true)
      ),
    ];

    // Shared asset balance
    if (pool.type === PoolType.Stable && pool.id) {
      subs.push(
        await this.subscribeTokenBalance(
          HYDRADX_OMNIPOOL_ADDRESS,
          [pool.id],
          this.updateBalanceCallback(pool, 'share', () => true)
        )
      );
    }

    return subs;
  }

  private updateBalanceCallback(
    pool: PoolBase,
    type: string,
    canUpdate: (pool: PoolBase, token: string) => boolean
  ) {
    this.updateBalanceLog(pool, type);
    return function (token: string, balance: BigNumber) {
      const tokenIndex = pool.tokens.findIndex((t) => t.id == token);
      if (tokenIndex >= 0 && canUpdate(pool, token)) {
        pool.tokens[tokenIndex].balance = balance.toString();
      }
    };
  }

  private updateBalanceLog(pool: PoolBase, type: string) {
    const poolAddr = pool.address.substring(0, 10).concat('...');
    console.log(`${pool.type} [${poolAddr}] ${type} balance subscribed`);
  }
}
