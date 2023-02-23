import { AbstractProvider, Contract, ethers } from 'ethers';
import { Observable, Subject, shareReplay, filter, finalize, distinctUntilChanged } from 'rxjs';
import { AssetBalance } from '../../types';
import { ChainAsset } from '../../registry';
import { bnum, ZERO } from '../../utils/bignumber';
import { BalanceAdapter, EvmProvider } from '../types';

const ABI = [
  'function balanceOf(address) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint amount)',
];

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
    const contract = new Contract(asset.asset.Erc20, ABI, this.client);

    const run = async () => {
      const evmAddress = await this.evmProvider.toEvmAddress(address);
      const updateBalance = async () => {
        const balance = await contract.balanceOf(evmAddress);
        balance$.next({
          free: bnum(balance),
          locked: ZERO,
          reserved: ZERO,
          available: bnum(balance),
        });
      };
      await updateBalance();

      this.client.on('block', async (_n) => {
        updateBalance();
      });

      return () => {
        this.client.removeAllListeners('block');
      };
    };

    let disconnectSubscribeBlock: () => void;
    run().then((unsub) => (disconnectSubscribeBlock = unsub));

    return observer.pipe(
      finalize(() => {
        disconnectSubscribeBlock && disconnectSubscribeBlock();
      }),
      filter((i) => !!i),
      distinctUntilChanged((prev, curr) => prev.available.eq(curr.available))
    ) as Observable<AssetBalance>;
  }
}
