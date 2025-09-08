import { ApiPromise } from '@polkadot/api';
import {
  PalletBalancesAccountData,
  OrmlTokensAccountData,
} from '@polkadot/types/lookup';
import { UnsubscribePromise } from '@polkadot/api-base/types';

import { PolkadotApiClient } from '../api';
import { SYSTEM_ASSET_ID } from '../consts';
import { BigNumber } from '../utils/bignumber';

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
    const data = await this.api.query.tokens.accounts(account, assetId);
    return this.calculateFreeBalance(data);
  }

  async getErc20Balance(account: string, assetId: string): Promise<BigNumber> {
    const data = await this.getTokenBalanceData(account, assetId);
    return this.calculateFreeBalance(data);
  }

  async subscribeSystemBalance(
    address: string,
    onChange: (token: string, balance: BigNumber) => void
  ): UnsubscribePromise {
    return this.api.query.system.account(address, ({ data }) =>
      onChange(SYSTEM_ASSET_ID, this.calculateFreeBalance(data))
    );
  }

  async subscribeSystemBalances(
    queries: string[],
    onChange: (balances: [string, BigNumber][]) => void
  ): UnsubscribePromise {
    return this.api.query.system.account.multi(queries, (balances) => {
      const result: [string, BigNumber][] = [];
      balances.forEach((data, i) => {
        const freeBalance = this.calculateFreeBalance(data.data);
        const query = queries[i];
        result.push([query, freeBalance]);
      });
      onChange(result);
    });
  }

  async subscribeTokenBalance(
    address: string,
    onChange: (balances: [string, BigNumber][]) => void,
    assets?: string[]
  ): UnsubscribePromise {
    const keys = await this.api.query.tokens.accounts.keys(address);

    const queries = assets
      ? assets.map((a) => [address, a])
      : keys.map(({ args: [acc, token] }) => [
          acc.toString(),
          token.toString(),
        ]);

    return this.api.query.tokens.accounts.multi(queries, (balances) => {
      const result: [string, BigNumber][] = [];
      balances.forEach((data, i) => {
        const freeBalance = this.calculateFreeBalance(data);
        const token = queries[i][1];
        result.push([token, freeBalance]);
      });
      onChange(result);
    });
  }

  async subscribeTokenBalances(
    queries: string[][],
    onChange: (balances: [string[], BigNumber][]) => void
  ): UnsubscribePromise {
    return this.api.query.tokens.accounts.multi(queries, (balances) => {
      const result: [string[], BigNumber][] = [];
      balances.forEach((data, i) => {
        const freeBalance = this.calculateFreeBalance(data);
        const query = queries[i];
        result.push([query, freeBalance]);
      });
      onChange(result);
    });
  }

  async subscribeErc20Balance(
    address: string,
    onChange: (balances: [string, BigNumber][]) => void,
    assets?: string[]
  ): UnsubscribePromise {
    const getErc20s = async () => {
      const assets = await this.api.query.assetRegistry.assets.entries();
      return assets
        .filter(([_args, value]) => {
          const { assetType } = value.unwrap();
          return assetType.toString() === 'Erc20';
        })
        .map(
          ([
            {
              args: [id],
            },
          ]) => id.toString()
        );
    };

    const ids = assets ? assets : await getErc20s();
    const getErc20Balance = async () => {
      const balances: [string, BigNumber][] = await Promise.all(
        ids.map(async (id: string) => [
          id,
          await this.getErc20Balance(address, id),
        ])
      );
      onChange(balances);
    };

    return this.api.rpc.chain.subscribeNewHeads(async () => {
      getErc20Balance();
    });
  }

  async subscribeErc20Balances(
    queries: string[][],
    onChange: (balances: [string[], BigNumber][]) => void
  ): UnsubscribePromise {
    const getErc20Balance = async () => {
      const balances: [string[], BigNumber][] = await Promise.all(
        queries.map(async (query) => {
          const [address, asset] = query;
          return [query, await this.getErc20Balance(address, asset)];
        })
      );
      onChange(balances);
    };

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

  protected calculateFreeBalance(
    data: PalletBalancesAccountData | OrmlTokensAccountData
  ): BigNumber {
    const freeBalance = data.free.toString();
    const frozenBalance = data.frozen.toString();

    if (BigNumber(freeBalance).lt(frozenBalance)) return BigNumber(0);

    return BigNumber(freeBalance).minus(frozenBalance);
  }
}
