import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { SYSTEM_ASSET_ID } from '../consts';
import { BigNumber } from '../utils/bignumber';

import { PolkadotApiClient } from './PolkadotApi';

export class BalanceClient extends PolkadotApiClient {
  constructor(api: ApiPromise) {
    super(api);
  }

  async getBalance(accountId: string, tokenKey: string): Promise<BigNumber> {
    return tokenKey === SYSTEM_ASSET_ID
      ? await this.getSystemBalance(accountId)
      : await this.getTokenBalance(accountId, tokenKey);
  }

  async getSystemBalance(accountId: string): Promise<BigNumber> {
    const { data } = await this.api.query.system.account(accountId);
    return this.calculateFreeBalance(data);
  }

  async getTokenBalance(
    accountId: string,
    tokenKey: string
  ): Promise<BigNumber> {
    const { free, reserved, frozen } = await this.api.query.tokens.accounts(
      accountId,
      tokenKey
    );
    return this.calculateFreeBalance({ free, feeFrozen: reserved, frozen });
  }

  async subscribeBalance(
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

  async subscribeTokenBalance(
    address: string,
    tokens: string[],
    onChange: (token: string, balance: BigNumber) => void
  ): UnsubscribePromise {
    const tokenAccArgs = tokens
      .filter((t) => t !== SYSTEM_ASSET_ID)
      .map((t) => [address, t]);
    return this.api.query.tokens.accounts.multi(tokenAccArgs, (balances) => {
      balances.forEach((data, i) => {
        const freeBalance = this.calculateFreeBalance(data);
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
