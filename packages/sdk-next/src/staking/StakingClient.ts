import { Papi } from '../api';

export class StakingClient extends Papi {
  async getPalletId(): Promise<string> {
    const query = this.api.constants.Staking.PalletId;
    const value = await query();
    return value.asText();
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

  async getSixBlockSince() {
    const query = this.api.query.Staking.SixSecBlocksSince;
    const value = await query.getValue();
    return value.toString();
  }
}
