import { Observable } from 'rxjs';
import { AssetBalance } from '../types';
import { ChainAsset } from '../registry';

export interface BalanceAdapter {
  getObserver(asset: ChainAsset, address: string): Observable<AssetBalance>;
}

export interface EvmProvider {
  toEvmAddress(address: string): Promise<string>;
  getEndpoint(): string;
}
