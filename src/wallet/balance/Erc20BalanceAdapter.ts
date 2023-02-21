import { AbstractProvider, Contract, ethers } from 'ethers';
import { Observable, Subject, shareReplay } from 'rxjs';
import { AssetBalance } from '../../types';
import { ChainAsset } from '../../registry';
import { bnum, ZERO } from '../../utils/bignumber';
import { BalanceAdapter, EvmProvider } from '../types';

export class Erc20BalanceAdapter implements BalanceAdapter {
  readonly client: AbstractProvider;
  readonly evmProvider: EvmProvider;

  constructor(evmProvider: EvmProvider) {
    this.evmProvider = evmProvider;
    this.client = ethers.getDefaultProvider(evmProvider.getEndpoint());
  }

  public getObserver(asset: ChainAsset, address: string): Observable<AssetBalance> {
    const balance$ = new Subject<AssetBalance>();
    const observer = balance$.pipe(shareReplay(1));
    const token = new Contract(asset.asset.Erc20, ['function balanceOf(address) view returns (uint256)'], this.client);

    const run = async () => {
      const evmAddress = await this.evmProvider.toEvmAddress(address);
      const balance = await token.balanceOf(evmAddress);
      balance$.next({
        free: bnum(balance),
        locked: ZERO,
        reserved: ZERO,
        available: bnum(balance),
      });
    };
    run();
    return observer;
  }
}
