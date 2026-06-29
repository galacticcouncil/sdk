import {
  distinctUntilChanged,
  finalize,
  shareReplay,
  Observable,
  Subject,
} from 'rxjs';

import { Asset, AssetAmount } from '../../asset';
import { Erc20Client } from '../../evm';

import { EvmBalanceType } from './types';

import type { AnyEvmChain } from '../types';

/**
 * Reads evm balances (native + erc20) from a chain's evm client. Owned by
 * {@link EvmChain} / {@link EvmParachain}.
 */
export class EvmBalanceClient {
  constructor(private readonly chain: AnyEvmChain) {}

  async getBalance(
    asset: Asset,
    account: string,
    type: EvmBalanceType
  ): Promise<AssetAmount> {
    const client = this.chain.evmClient;
    switch (type) {
      case EvmBalanceType.Native: {
        const balance = await client
          .getProvider()
          .getBalance({ address: account as `0x${string}` });
        return AssetAmount.fromAsset(asset, {
          amount: balance,
          decimals: client.chain.nativeCurrency.decimals,
        });
      }
      case EvmBalanceType.Erc20: {
        const assetId = this.chain.getBalanceAssetId(asset);
        if (!assetId || typeof assetId !== 'string') {
          throw new Error(`Invalid contract address: ${asset.key}`);
        }
        const erc20 = new Erc20Client(client, assetId);
        const [balance, decimals] = await Promise.all([
          erc20.balanceOf(account),
          erc20.decimals(),
        ]);
        return AssetAmount.fromAsset(asset, {
          amount: balance,
          decimals: decimals,
        });
      }
      default:
        throw new Error('Unsupported evm balance type: ' + type);
    }
  }

  subscribe(
    asset: Asset,
    account: string,
    type: EvmBalanceType
  ): Observable<AssetAmount> {
    const provider = this.chain.evmClient.getProvider();
    const subject = new Subject<AssetAmount>();
    const observable = subject.pipe(shareReplay(1));

    const run = async () => {
      const update = async () =>
        subject.next(await this.getBalance(asset, account, type));
      await update();
      const unsub = provider.watchBlocks({ onBlock: () => update() });
      return () => unsub();
    };

    let disconnect: () => void;
    run().then((unsub) => (disconnect = unsub));

    return observable.pipe(
      finalize(() => disconnect?.()),
      distinctUntilChanged((prev, curr) => prev.amount === curr.amount)
    ) as Observable<AssetAmount>;
  }
}
