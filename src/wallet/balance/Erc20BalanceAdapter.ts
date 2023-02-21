import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { ApiPromise, ApiRx } from '@polkadot/api';
import { Observable, Subject, shareReplay } from 'rxjs';
import { AssetBalance } from '../../types';
import { ChainAsset } from '../../registry';
import { bnum, ZERO } from '../../utils/bignumber';
import { BalanceAdapter } from '../types';

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
  readonly api: ApiPromise | ApiRx;

  constructor(api: ApiPromise | ApiRx, evmProvider: string) {
    this.api = api;
    this.client = new Web3(new Web3.providers.HttpProvider(evmProvider));
  }

  public getObserver(asset: ChainAsset, address: string): Observable<AssetBalance> {
    //const evmAddress = u8aToHex(addressToEvm(address, true));
    const balance$ = new Subject<AssetBalance>();
    const observer = balance$.pipe(shareReplay(1));
    const contract = new this.client.eth.Contract(minABI, asset.asset.Erc20);
    //const evmAddress = this.evmAddress(address);

    const run = async () => {
      const balance = await contract.methods.balanceOf(address).call();
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

  //protected abstract evmAddress(ss58address: string): string;
}
