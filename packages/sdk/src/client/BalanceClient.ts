import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { SYSTEM_ASSET_ID } from '../consts';
import { BigNumber, ZERO } from '../utils/bignumber';

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
    const {
      data: { free, miscFrozen, feeFrozen },
    } = await this.api.query.system.account(accountId);
    return this.calculateFreeBalance(
      free.toString(),
      miscFrozen.toString(),
      feeFrozen.toString()
    );
  }

  async getTokenBalance(
    accountId: string,
    tokenKey: string
  ): Promise<BigNumber> {
    const { free, reserved, frozen } = await this.api.query.tokens.accounts(
      accountId,
      tokenKey
    );
    return this.calculateFreeBalance(
      free.toString(),
      ZERO.toFixed(),
      frozen.toString()
    );
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
        const freeBalance = this.calculateFreeBalance(
          free.toString(),
          reserved.toString(),
          frozen.toString()
        );
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
      balances.forEach(({ free, reserved, frozen }, i) => {
        const freeBalance = this.calculateFreeBalance(
          free.toString(),
          reserved.toString(),
          frozen.toString()
        );
        const token = tokenAccArgs[i][1];
        onChange(token, freeBalance);
      });
    });
  }

  async subscribeSystemBalance(
    address: string,
    onChange: (token: string, balance: BigNumber) => void
  ): UnsubscribePromise {
    return this.api.query.system.account(
      address,
      ({ data: { free, miscFrozen, feeFrozen } }) => {
        const freeBalance = this.calculateFreeBalance(
          free.toString(),
          miscFrozen.toString(),
          feeFrozen.toString()
        );
        onChange(SYSTEM_ASSET_ID, freeBalance);
      }
    );
  }

  private calculateFreeBalance(
    free: string,
    miscFrozen: string,
    feeFrozen: string
  ): BigNumber {
    const freeBN = new BigNumber(free);
    const miscFrozenBN = new BigNumber(miscFrozen);
    const feeFrozenBN = new BigNumber(feeFrozen);
    const maxFrozenBN = miscFrozenBN.gt(feeFrozenBN)
      ? miscFrozenBN
      : feeFrozenBN;
    return freeBN.minus(maxFrozenBN);
  }
}
