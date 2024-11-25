import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise, VoidFn } from '@polkadot/api-base/types';
import { u32, Vec } from '@polkadot/types';
import { ITuple } from '@polkadot/types-codec/types';
import { OrmlTokensAccountData } from '@polkadot/types/lookup';

import { memoize1 } from '@thi.ng/memoize';

import { AssetClient, BalanceClient } from '../client';
import { Asset } from '../types';
import { BigNumber, ZERO } from '../utils/bignumber';

export class WalletCtx extends BalanceClient {
  protected readonly assetClient: AssetClient;

  protected ctx: Map<string, BigNumber> = new Map([]);
  protected subs: VoidFn[] = [];

  private assets: Asset[] = [];

  private memBalances = memoize1((account: string) => {
    console.log('Wallet mem balances', account, '✅');
    return this.getBalances(account);
  });

  constructor(api: ApiPromise) {
    super(api);
    this.assetClient = new AssetClient(this.api);
  }

  async getBalancesMem(account: string): Promise<Map<string, BigNumber>> {
    return this.memBalances(account);
  }

  private async getBalances(account: string): Promise<Map<string, BigNumber>> {
    this.unsubscribe();

    const balances = await this.getAccountBalanceData(account);
    balances.forEach(([token, data]) => {
      this.ctx.set(token.toString(), this.calculateFreeBalance(data));
    });

    this.assets = await this.assetClient.getOnChainAssets(true);
    this.subs = await Promise.all([
      this.subscribeSystemAccountBalance(account),
      this.subscribeTokensAccountBalance(account),
      this.subscribeErc20AccountBalance(account),
    ]);

    console.log(`Wallet assets(${this.assets.length})`, '✅');
    console.log(`Wallet subs(${this.subs.length})`, '✅');

    return this.ctx;
  }

  unsubscribe() {
    this.subs.forEach((unsub) => {
      unsub();
    });
  }

  private async getAccountBalanceData(account: string) {
    return await this.api.call.currenciesApi.accounts<
      Vec<ITuple<[u32, OrmlTokensAccountData]>>
    >(account.toString());
  }

  private subscribeTokensAccountBalance(account: string): UnsubscribePromise {
    const updateCtx = this.updateCtxCallback(this.ctx);
    return this.subscribeTokenBalance(account, this.assets, (balances) =>
      balances.forEach(([token, balance]) => updateCtx(token, balance))
    );
  }

  private subscribeErc20AccountBalance(account: string): UnsubscribePromise {
    const updateCtx = this.updateCtxCallback(this.ctx);
    return this.subscribeErc20Balance(account, this.assets, (balances) =>
      balances.forEach(([token, balance]) => updateCtx(token, balance))
    );
  }

  private subscribeSystemAccountBalance(account: string): UnsubscribePromise {
    const updateCtx = this.updateCtxCallback(this.ctx);
    return this.subscribeSystemBalance(account, (token, balance) =>
      updateCtx(token, balance)
    );
  }

  private updateCtxCallback(ctx: Map<string, BigNumber>) {
    return function (token: string, balance: BigNumber) {
      if (balance.isGreaterThan(ZERO)) {
        ctx.set(token, balance);
      } else {
        ctx.delete(token);
      }
    };
  }
}
