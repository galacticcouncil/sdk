import {
  Asset,
  AssetAmount,
  BaseConfig,
  CallType,
} from '@galacticcouncil/xcm-core';

import { Observable } from 'rxjs';

export interface Platform<T extends BaseConfig, B extends BaseConfig> {
  calldata(account: string, amount: bigint, config: T): Promise<Call>;
  estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: T
  ): Promise<AssetAmount>;
  getBalance(asset: Asset, config: B): Promise<AssetAmount>;
  subscribeBalance(asset: Asset, config: B): Promise<Observable<AssetAmount>>;
}

export interface Call {
  /** Owner of transation. */
  from: string;
  /** Hex-encoded call data. */
  data: string;
  /** Calltype. */
  type: CallType;
}
