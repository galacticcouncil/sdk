import { PolkadotClient } from 'polkadot-api';

import { Papi } from '../api';

const BLOCK_TIME_SAMPLE = 100;
const BLOCK_TIME_TTL = 60_000;
const BLOCK_TIME_MIN = 250;
const BLOCK_TIME_MAX = 60_000;

export class ChainParams extends Papi {
  private _minOrderBudget?: bigint;
  private _minimalPeriod?: number;

  private _blockTime?: number;
  private _blockTimeAt = 0;

  constructor(client: PolkadotClient) {
    super(client);
  }

  async getBlockTime(): Promise<number> {
    const now = Date.now();
    const isFresh =
      this._blockTime !== undefined && now - this._blockTimeAt < BLOCK_TIME_TTL;

    if (isFresh) return this._blockTime!;

    this._blockTime = await this.deriveBlockTime();
    this._blockTimeAt = now;
    return this._blockTime;
  }

  async getMinimalPeriod(): Promise<number> {
    if (this._minimalPeriod === undefined) {
      this._minimalPeriod = await this.api.constants.DCA.MinimalPeriod();
    }
    return this._minimalPeriod;
  }

  async getMinOrderBudget(): Promise<bigint> {
    if (this._minOrderBudget === undefined) {
      this._minOrderBudget =
        await this.api.constants.DCA.MinBudgetInNativeCurrency();
    }
    return this._minOrderBudget;
  }

  /**
   * Block time in ms, derived over the last blocks.
   *
   * - Several blocks are authored per slot, so the slot duration alone is not
   *   the block time; the timestamp advances once per slot, not once per block
   * - Rounding the blocks-per-slot to an integer yields the nominal rate the
   *   runtime derives its own block-denominated periods from
   * - Falls back to the slot duration if the span is unavailable
   */
  private async deriveBlockTime(): Promise<number> {
    const slot = await this.getSlotDuration();

    try {
      const tip = await this.resolveBlock();
      const from = tip.number - BLOCK_TIME_SAMPLE;

      if (from < 1) return slot;

      const fromHash = await this.api.query.System.BlockHash.getValue(from, {
        at: tip.hash,
      });

      if (!fromHash || /^0x0+$/.test(fromHash)) return slot;

      const [to, at] = await Promise.all([
        this.api.query.Timestamp.Now.getValue({ at: tip.hash }),
        this.api.query.Timestamp.Now.getValue({ at: fromHash }),
      ]);

      const elapsed = Number(to - at);
      if (elapsed <= 0) return slot;

      const blockTime = elapsed / BLOCK_TIME_SAMPLE;

      if (blockTime < BLOCK_TIME_MIN || blockTime > BLOCK_TIME_MAX) return slot;

      return blockTime;
    } catch {
      return slot;
    }
  }

  private async getSlotDuration(): Promise<number> {
    const slot = await this.api.constants.Aura.SlotDuration();
    return Number(slot);
  }
}
