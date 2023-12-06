import { Asset, AssetAmount } from '@moonbeam-network/xcm-types';

import { Observable } from 'rxjs';
import { XCall } from '../types';

export interface BalanceProvider<T> {
  read(asset: Asset, config: T): Promise<AssetAmount>;
  subscribe(asset: Asset, config: T): Observable<AssetAmount>;
}

export interface TransferProvider<T> {
  getFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: T,
  ): Promise<AssetAmount>;
  calldata(config: T): XCall;
}
