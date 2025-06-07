import { ApiPromise } from '@polkadot/api';

import { BigNumber, bnum } from '../utils/bignumber';

export class ChainParams {
  private api: ApiPromise;

  private _minOrderBudget?: string;
  private _blockTime?: number;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  get blockTime(): number {
    if (this._blockTime === undefined) {
      this._blockTime = this.api.consts.aura.slotDuration.toNumber();
    }
    return this._blockTime;
  }

  get minOrderBudget(): BigNumber {
    if (this._minOrderBudget === undefined) {
      this._minOrderBudget =
        this.api.consts.dca.minBudgetInNativeCurrency.toString();
    }
    return bnum(this._minOrderBudget);
  }
}
