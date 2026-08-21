import { log } from '@galacticcouncil/common';

import {
  defer,
  distinctUntilChanged,
  finalize,
  Observable,
  Subject,
} from 'rxjs';

import { Asset, AssetAmount } from '../../asset';
import { Erc20Client } from '../../evm';

import { EvmBalanceType } from './types';

import type { AnyEvmChain } from '../types';

const { logger } = log;

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

  // Deferred so retry (Chain.isolateBalances) rebuilds the watcher.
  subscribe(
    asset: Asset,
    account: string,
    type: EvmBalanceType
  ): Observable<AssetAmount> {
    return defer(() => {
      const provider = this.chain.evmClient.getProvider();
      const subject = new Subject<AssetAmount>();

      const run = async () => {
        const update = async () =>
          subject.next(await this.getBalance(asset, account, type));
        await update();
        const unsub = provider.watchBlocks({
          onBlock: () =>
            update().catch((err) =>
              logger.warn(`Balance update failed for ${asset.key}:`, err)
            ),
        });
        return () => unsub();
      };

      let disconnect: (() => void) | undefined;
      let closed = false;
      run()
        .then((unsub) => (closed ? unsub() : (disconnect = unsub)))
        .catch((err) => subject.error(err));

      return subject.pipe(
        finalize(() => {
          closed = true;
          disconnect?.();
        }),
        distinctUntilChanged((prev, curr) => prev.amount === curr.amount)
      );
    });
  }
}
