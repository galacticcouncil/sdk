import { PolkadotClient } from 'polkadot-api';

import { Papi } from '../api';
import { BLOCK_TIME_TARGET } from '../consts';

const BLOCK_TIME_SAMPLE = 100;
const BLOCK_TIME_TTL = 60 * 60 * 1000;

export class ChainParams extends Papi {
  private _minOrderBudget?: bigint;
  private _minimalPeriod?: number;

  private _blockTime?: number;
  private _blockTimeAt = 0;

  constructor(client: PolkadotClient) {
    super(client);
  }

  /**
   * Block time in ms, cached for the TTL.
   *
   * - A failed derivation caches the target rate, so a chain that cannot serve
   *   the sample is re-probed once per window rather than on every call
   */
  async getBlockTime(): Promise<number> {
    const isFresh =
      this._blockTime !== undefined &&
      Date.now() - this._blockTimeAt < BLOCK_TIME_TTL;

    if (isFresh) return this._blockTime!;

    const derived = await this.deriveBlockTime();

    this._blockTime = derived ?? BLOCK_TIME_TARGET;
    this._blockTimeAt = Date.now();
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
   * Block time in ms, averaged over the last blocks.
   *
   * - Undefined signals the span was unavailable
   */
  private async deriveBlockTime(): Promise<number | undefined> {
    try {
      const tip = await this.resolveBlock();
      const from = tip.number - BLOCK_TIME_SAMPLE;

      const fromHash = await this.api.query.System.BlockHash.getValue(from, {
        at: tip.hash,
      });

      const [to, at] = await Promise.all([
        this.api.query.Timestamp.Now.getValue({ at: tip.hash }),
        this.api.query.Timestamp.Now.getValue({ at: fromHash }),
      ]);

      const elapsed = Number(to - at);

      return elapsed > 0 ? elapsed / BLOCK_TIME_SAMPLE : undefined;
    } catch {
      return undefined;
    }
  }
}
