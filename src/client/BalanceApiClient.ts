import type { Struct, u128 } from '@polkadot/types-codec';
import { ApiPromise } from '@polkadot/api';
import { SYSTEM_ASSET_ID } from '../consts';
import { BigNumber, ZERO } from '../utils/bignumber';
import { Amount } from '../types';

import { AssetApiClient } from './AssetApiClient';

interface OrmlTokensAccountData extends Struct {
  readonly free: u128;
  readonly reserved: u128;
  readonly frozen: u128;
}

export class BalanceApiClient extends AssetApiClient {
  constructor(api: ApiPromise) {
    super(api);
  }

  async getAccountBalance(accountId: string, tokenKey: string): Promise<Amount> {
    const balance =
      tokenKey === SYSTEM_ASSET_ID
        ? await this.getSystemAccountBalance(accountId)
        : await this.getTokenAccountBalance(accountId, tokenKey);

    const metadata = await this.getAssetMetadata(tokenKey);
    return { amount: balance, decimals: metadata.decimals } as Amount;
  }

  async getSystemAccountBalance(accountId: string): Promise<BigNumber> {
    const {
      data: { free, miscFrozen, feeFrozen },
    } = await this.api.query.system.account(accountId);
    return this.calculateFreeBalance(free.toString(), miscFrozen.toString(), feeFrozen.toString());
  }

  async getTokenAccountBalance(accountId: string, tokenKey: string): Promise<BigNumber> {
    const { free, reserved, frozen } = await this.api.query.tokens.accounts<OrmlTokensAccountData>(accountId, tokenKey);
    return this.calculateFreeBalance(free.toString(), ZERO.toFixed(), frozen.toString());
  }

  private calculateFreeBalance(free: string, miscFrozen: string, feeFrozen: string): BigNumber {
    const freeBN = new BigNumber(free);
    const miscFrozenBN = new BigNumber(miscFrozen);
    const feeFrozenBN = new BigNumber(feeFrozen);
    const maxFrozenBN = miscFrozenBN.gt(feeFrozenBN) ? miscFrozenBN : feeFrozenBN;
    return freeBN.minus(maxFrozenBN);
  }
}
