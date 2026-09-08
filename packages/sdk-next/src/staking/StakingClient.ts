import { Binary } from 'polkadot-api';

import { Papi } from '../api';

export class StakingClient extends Papi {
  async getPalletId(): Promise<string> {
    const query = this.api.constants.Staking.PalletId;
    const value = await query();
    return Binary.toText(Binary.fromHex(value));
  }

  async getPeriodLength(): Promise<number> {
    const query = this.api.constants.Staking.PeriodLength;
    const value = await query();
    return value;
  }

  async getUnclaimablePeriods(): Promise<bigint> {
    const query = this.api.constants.Staking.UnclaimablePeriods;
    const value = await query();
    return value;
  }

  async getNFTCollectionId(): Promise<bigint> {
    const query = this.api.constants.Staking.NFTCollectionId;
    const value = await query();
    return value;
  }

  async getStaking() {
    const query = this.api.query.Staking.Staking;
    const value = await query.getValue();
    return value;
  }

  async getUniques(address: string, collectionId: bigint) {
    const query = this.api.query.Uniques.Account;
    const entries = await query.getEntries(address, collectionId);
    const data = entries.map(({ keyArgs }) => {
      const [address, collectionId, itemId] = keyArgs;
      return { address, collectionId, itemId };
    });
    return data;
  }

  async getStakingPositionsValue(id: bigint) {
    const query = this.api.query.Staking.Positions;
    const value = await query.getValue(id);
    return value;
  }

  async getStakingVotes(id: bigint) {
    const query = this.api.query.Staking.Votes;
    const value = await query.getValue(id);
    return value;
  }

  async getReferendumInfo(key: number) {
    const query = this.api.query.Referenda.ReferendumInfoFor;
    const value = await query.getValue(key);
    return value;
  }

  async getTimePointsPerPeriod() {
    const query = this.api.constants.Staking.TimePointsPerPeriod;
    const value = await query();
    return value;
  }

  async getTimePointsWeight() {
    const query = this.api.constants.Staking.TimePointsWeight;
    const value = await query();
    return value / 1000000;
  }

  async getActionPointsWeight() {
    const query = this.api.constants.Staking.ActionPointsWeight;
    const value = await query();
    return value / 1000000000;
  }

  async getSixBlockSince() {
    const query = this.api.query.Staking.SixSecBlocksSince;
    const value = await query.getValue();
    return value.toString();
  }

  /**
   * `Parameters.TwoSecBlocksSince` — block of the 6s→2s switch, set once
   * by the runtime migration (`u32::MAX` until then). Read via the unsafe
   * api: the Parameters pallet is newer than the generated descriptors.
   * Falls back to the sentinel on pre-2s runtimes, which reduces
   * `calculatePeriodNumber` to the legacy 3-arg behaviour.
   */
  async getTwoSecBlocksSince(): Promise<string> {
    const U32_MAX = '4294967295';
    try {
      const query = this.client.getUnsafeApi().query as unknown as {
        Parameters: {
          TwoSecBlocksSince: { getValue: () => Promise<number | undefined> };
        };
      };
      const value = await query.Parameters.TwoSecBlocksSince.getValue();
      return value === undefined ? U32_MAX : value.toString();
    } catch {
      return U32_MAX;
    }
  }
}
