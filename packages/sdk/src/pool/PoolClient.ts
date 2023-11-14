import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { HYDRADX_OMNIPOOL_ADDRESS } from '../consts';
import { PoolBase, PoolFees, PoolType } from '../types';

import { BalanceClient } from '../client';
import BigNumber from 'bignumber.js';

export abstract class PoolClient extends BalanceClient {
  protected pools: PoolBase[] = [];
  protected subs: UnsubscribePromise[] = [];
  private poolsLoaded = false;

  constructor(api: ApiPromise) {
    super(api);
  }

  protected abstract loadPools(): Promise<PoolBase[]>;
  abstract getPoolType(): PoolType;
  abstract getPoolFees(feeAsset: string, address: string): Promise<PoolFees>;
  protected abstract subscribe(pool: PoolBase): UnsubscribePromise;

  async getPools(): Promise<PoolBase[]> {
    if (this.poolsLoaded) {
      return this.pools;
    }
    console.time(`Load ${this.getPoolType()}`);
    this.pools = await this.loadPools();
    console.timeEnd(`Load ${this.getPoolType()}`);
    this.subs = this.pools.map((pool) => this.getSubs(pool)).flat();
    this.poolsLoaded = true;
    return this.pools;
  }

  private getSubs(pool: PoolBase) {
    const subs = [
      this.subscribe(pool),
      this.subscribeTokenBalance(
        pool.address,
        pool.tokens.map((t) => t.id),
        this.updateBalanceListener(pool, 'token')
      ),
      this.subscribeSystemBalance(
        pool.address,
        this.updateBalanceListener(pool, 'system')
      ),
    ];

    if (pool.type === PoolType.Stable && pool.id) {
      subs.push(
        this.subscribeTokenBalance(
          HYDRADX_OMNIPOOL_ADDRESS,
          [pool.id],
          this.updateShareBalanceListener(pool, 'share')
        )
      );
    }

    return subs;
  }

  private updateBalanceListener(pool: PoolBase, type: string) {
    this.log(pool, type);
    return function (token: string, balance: BigNumber) {
      const tokenIndex = pool.tokens.findIndex((t) => t.id == token);
      // If asset found and not shared asset
      if (tokenIndex >= 0 && pool.id !== token) {
        pool.tokens[tokenIndex].balance = balance.toString();
      }
    };
  }

  private updateShareBalanceListener(pool: PoolBase, type: string) {
    this.log(pool, type);
    return function (token: string, balance: BigNumber) {
      const tokenIndex = pool.tokens.findIndex((t) => t.id == token);
      if (tokenIndex >= 0) {
        pool.tokens[tokenIndex].balance = balance.toString();
      }
    };
  }

  private log(pool: PoolBase, type: string) {
    const poolAddr = pool.address.substring(0, 10).concat('...');
    console.log(
      `${pool.type} [${poolAddr}] ${type} balance listener subscribed`
    );
  }
}
