import { PolkadotClient } from 'polkadot-api';

import { Papi } from '../api';

export class ChainParams extends Papi {
  private _minOrderBudget?: bigint;
  private _blockTime?: number;

  constructor(client: PolkadotClient) {
    super(client);
  }

  async getBlockTime(): Promise<number> {
    if (this._blockTime === undefined) {
      const slot = await this.api.constants.Aura.SlotDuration();
      this._blockTime = Number(slot);
    }
    return this._blockTime;
  }

  async getMinOrderBudget(): Promise<bigint> {
    if (this._minOrderBudget === undefined) {
      this._minOrderBudget =
        await this.api.constants.DCA.MinBudgetInNativeCurrency();
    }
    return this._minOrderBudget;
  }
}
