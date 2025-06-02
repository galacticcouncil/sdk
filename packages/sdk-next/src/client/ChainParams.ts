import { PolkadotClient } from 'polkadot-api';
import { hydration } from '@galacticcouncil/descriptors';

export class ChainParams {
  private client: PolkadotClient;

  private _minOrderBudget?: bigint;
  private _blockTime?: number;

  constructor(client: PolkadotClient) {
    this.client = client;
  }

  public get api() {
    return this.client.getTypedApi(hydration);
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
