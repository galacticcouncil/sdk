import { ApiPromise } from '@polkadot/api';
import { OrmlTokensAccountData } from '@polkadot/types/lookup';
import { UnsubscribePromise } from '@polkadot/api-base/types';

import { SYSTEM_ASSET_ID } from '../consts';
import { Asset } from '../types';
import { BigNumber } from '../utils/bignumber';

import { PolkadotApiClient } from './PolkadotApi';

export class BalanceClient extends PolkadotApiClient {
  constructor(api: ApiPromise) {
    super(api);
  }

  async getBalance(account: string, assetId: string): Promise<BigNumber> {
    const asset = await this.api.query.assetRegistry.assets(assetId);
    const { assetType } = asset.unwrap();

    if (assetType.toString() === 'Erc20') {
      return this.getErc20Balance(account, assetId);
    }

    return assetId === SYSTEM_ASSET_ID
      ? this.getSystemBalance(account)
      : this.getTokenBalance(account, assetId);
  }

  async getSystemBalance(account: string): Promise<BigNumber> {
    const { data } = await this.api.query.system.account(account);
    return this.calculateFreeBalance(data);
  }

  async getTokenBalance(account: string, assetId: string): Promise<BigNumber> {
    const { free, reserved, frozen } = await this.api.query.tokens.accounts(
      account,
      assetId
    );
    return this.calculateFreeBalance({ free, feeFrozen: reserved, frozen });
  }

  async getErc20Balance(account: string, assetId: string): Promise<BigNumber> {
    const { free, reserved, frozen } = await this.getTokenBalanceData(
      account,
      assetId
    );
    return this.calculateFreeBalance({ free, feeFrozen: reserved, frozen });
  }

  async subscribeSystemBalance(
    address: string,
    onChange: (token: string, balance: BigNumber) => void
  ): UnsubscribePromise {
    return this.api.query.system.account(address, ({ data }) =>
      onChange(SYSTEM_ASSET_ID, this.calculateFreeBalance(data))
    );
  }

  async subscribeTokenBalance(
    address: string,
    assets: Asset[],
    onChange: (token: string, balance: BigNumber) => void
  ): UnsubscribePromise {
    const supported = assets
      .filter((a) => a.type !== 'Erc20')
      .filter((a) => a.id !== SYSTEM_ASSET_ID);

    const callArgs = supported.map((a) => [address, a.id]);
    return this.api.query.tokens.accounts.multi(callArgs, (balances) => {
      balances.forEach((data, i) => {
        const freeBalance = this.calculateFreeBalance(data);
        const token = callArgs[i][1];
        onChange(token, freeBalance);
      });
    });
  }

  async subscribeErc20Balance(
    address: string,
    assets: Asset[],
    onChange: (token: string, balance: BigNumber) => void
  ): UnsubscribePromise {
    const supported = assets.filter((a) => a.type === 'Erc20');

    const getErc20Balance = async () => {
      const balances: [string, BigNumber][] = await Promise.all(
        supported.map(async (token: Asset) => [
          token.id,
          await this.getErc20Balance(address, token.id),
        ])
      );
      balances.forEach(([token, balance]) => {
        onChange(token, balance);
      });
    };

    await getErc20Balance();
    return this.api.rpc.chain.subscribeNewHeads(async () => {
      getErc20Balance();
    });
  }

  async getTokenBalanceData(account: string, assetId: string) {
    return this.api.call.currenciesApi.account<OrmlTokensAccountData>(
      assetId,
      account
    );
  }

  protected calculateFreeBalance(data: any): BigNumber {
    const { free, miscFrozen, feeFrozen, frozen } = data;
    const freeBN = new BigNumber(free);
    const miscFrozenBN = new BigNumber(miscFrozen || frozen);
    const feeFrozenBN = new BigNumber(feeFrozen || 0n);
    const maxFrozenBN = miscFrozenBN.gt(feeFrozenBN)
      ? miscFrozenBN
      : feeFrozenBN;
    return freeBN.minus(maxFrozenBN);
  }
}
