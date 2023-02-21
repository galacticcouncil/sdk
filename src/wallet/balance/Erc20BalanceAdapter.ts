import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Observable, Subject, shareReplay } from 'rxjs';
import { AssetBalance } from '../../types';
import { ChainAsset } from '../../registry';
import { bnum, ZERO } from '../../utils/bignumber';
import { BalanceAdapter, EvmProvider } from '../types';

const minABI: AbiItem[] = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
];

export class Erc20BalanceAdapter implements BalanceAdapter {
  readonly client: Web3;
  readonly evmProvider: EvmProvider;

  constructor(evmProvider: EvmProvider) {
    this.evmProvider = evmProvider;
    this.client = new Web3(new Web3.providers.HttpProvider(evmProvider.getEndpoint()));
  }

  public getObserver(asset: ChainAsset, address: string): Observable<AssetBalance> {
    const balance$ = new Subject<AssetBalance>();
    const observer = balance$.pipe(shareReplay(1));
    const contract = new this.client.eth.Contract(minABI, asset.asset.Erc20);

    const run = async () => {
      const evmAddress = await this.evmProvider.toEvmAddress(address);
      const balance = await contract.methods.balanceOf(evmAddress).call();
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
