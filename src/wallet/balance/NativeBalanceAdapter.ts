import { ApiPromise, ApiRx } from '@polkadot/api';
import { AssetBalance } from '../../types';
import { BigNumber, bnum, scale } from '../../utils/bignumber';
import { Observable } from 'rxjs';
import { ChainAsset } from '../../registry';

export abstract class NativeBalanceAdapter {
  readonly nativeToken: string;
  readonly decimals: number;
  readonly ed: BigNumber;

  constructor(api: ApiPromise | ApiRx) {
    this.nativeToken = api.registry.chainTokens[0];
    this.decimals = api.registry.chainDecimals[0];
    this.ed = this.getDeposit(api);
  }

  private getDeposit(api: ApiPromise | ApiRx) {
    const ed = api.consts.balances?.existentialDeposit?.toString() || '0';
    return scale(bnum(ed), this.decimals);
  }

  public abstract getObserver(token: ChainAsset, address: string): Observable<AssetBalance>;
}
