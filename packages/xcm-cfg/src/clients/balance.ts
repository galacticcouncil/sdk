import { Parachain } from '@galacticcouncil/xcm-core';

import {
  FrameSystemAccountInfo,
  OrmlTokensAccountData,
  PalletBalancesAccountData,
} from '@polkadot/types/lookup';

export abstract class BalanceClient {
  readonly chain: Parachain;

  constructor(chain: Parachain) {
    this.chain = chain;
  }

  async getSystemAccountBalance(address: string): Promise<bigint> {
    const api = await this.chain.api;
    const response =
      await api.query.system.account<FrameSystemAccountInfo>(address);
    const balance = response.data as PalletBalancesAccountData;
    const { free, frozen } = balance;
    return BigInt(free.sub(frozen).toString());
  }

  async getTokensAccountsBalance(
    address: string,
    asset: string
  ): Promise<bigint> {
    const api = await this.chain.api;
    const response = await api.query.tokens.accounts<OrmlTokensAccountData>(
      address,
      asset
    );
    const { free, frozen } = response;
    return BigInt(free.sub(frozen).toString());
  }
}
