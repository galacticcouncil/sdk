import { Observable } from 'rxjs';
import { AssetBalance } from '../types';
import { ChainAsset, ChainAssetType } from '../registry';

export interface BalanceAdapter {
  getObserver(asset: ChainAsset, address: string): Observable<AssetBalance>;
}
