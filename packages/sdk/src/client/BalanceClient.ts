import { ApiPromise } from '@polkadot/api';
import { u32, Vec } from '@polkadot/types';
import { ITuple } from '@polkadot/types-codec/types';
import { OrmlTokensAccountData } from '@polkadot/types/lookup';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { SYSTEM_ASSET_ID } from '../consts';
import { BigNumber } from '../utils/bignumber';

import { PolkadotApiClient } from './PolkadotApi';

export class BalanceClient extends PolkadotApiClient {
  constructor(api: ApiPromise) {
    super(api);
  }

  async getTokenBalanceData(accountId: string, tokenKey: string) {
    const params = this.api.createType('(AssetId, AccountId)', [
      tokenKey,
      accountId,
    ]);
    const result = await this.api.rpc.state.call(
      'CurrenciesApi_account',
      params.toHex()
    );
    return this.api.createType<OrmlTokensAccountData>(
      'OrmlTokensAccountData',
      result
    );
  }

  async getAccountBalanceData(accountId: string) {
    const params = this.api.createType('AccountId', accountId);
    const result = await this.api.rpc.state.call(
      'CurrenciesApi_accounts',
      params.toHex()
    );

    return this.api.createType<Vec<ITuple<[u32, OrmlTokensAccountData]>>>(
      'Vec<(AssetId, OrmlTokensAccountData)>',
      result
    );
  }

  async getBalance(accountId: string, tokenKey: string): Promise<BigNumber> {
    const data = this.getTokenBalanceData(accountId, tokenKey);
    return this.calculateFreeBalance(data);
  }

  async subscribeBalances(
    address: string,
    onChange: (balances: [string, BigNumber][]) => void
  ): UnsubscribePromise {
    const getBalances = async () => {
      const result: [string, BigNumber][] = [];
      const balances = await this.getAccountBalanceData(address);
      balances.forEach(([token, data]) => {
        result.push([token.toString(), this.calculateFreeBalance(data)]);
      });
      onChange(result);
    };

    await getBalances();
    return this.api.rpc.chain.subscribeNewHeads(async () => {
      getBalances();
    });
  }

  async subscribeBalance(
    address: string,
    token: string,
    onChange: (token: string, balance: BigNumber) => void
  ): UnsubscribePromise {
    const getBalance = async () => {
      const data = await this.getTokenBalanceData(address, token);
      onChange(token.toString(), this.calculateFreeBalance(data));
    };

    await getBalance();
    return this.api.rpc.chain.subscribeNewHeads(async () => {
      getBalance();
    });
  }

  async subscribeTokenBalance(
    address: string,
    tokens: string[],
    onChange: (token: string, balance: BigNumber) => void
  ): UnsubscribePromise {
    const tokenAccArgs = tokens
      .filter((t) => t !== SYSTEM_ASSET_ID)
      .map((t) => [address, t]);
    return this.api.query.tokens.accounts.multi(tokenAccArgs, (balances) => {
      balances.forEach(({ free, reserved, frozen }, i) => {
        const freeBalance = this.calculateFreeBalance({
          free,
          feeFrozen: reserved,
          frozen,
        });
        const token = tokenAccArgs[i][1];
        onChange(token, freeBalance);
      });
    });
  }

  async subscribeSystemBalance(
    address: string,
    onChange: (token: string, balance: BigNumber) => void
  ): UnsubscribePromise {
    return this.api.query.system.account(address, ({ data }) =>
      onChange(SYSTEM_ASSET_ID, this.calculateFreeBalance(data))
    );
  }

  private calculateFreeBalance(data: any): BigNumber {
    const { free, miscFrozen, feeFrozen, frozen } = data;
    const freeBN = new BigNumber(free);
    const miscFrozenBN = new BigNumber(miscFrozen || frozen);
    const feeFrozenBN = new BigNumber(feeFrozen || 0);
    const maxFrozenBN = miscFrozenBN.gt(feeFrozenBN)
      ? miscFrozenBN
      : feeFrozenBN;
    return freeBN.minus(maxFrozenBN);
  }
}
