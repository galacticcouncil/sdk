import { HYDRATION_SS58_PREFIX } from '../consts';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';
import {
  calculate_accumulated_rps,
  calculate_period_number,
  calculate_rewards,
} from '@galacticcouncil/math-staking';
import Big from 'big.js';
import { StakingClient } from './StakingClient';

export const BIG_10 = Big(10);
export const BIG_BILL = Big(BIG_10.pow(12));

function getHydraAccountAddress(seed: string): string {
  return encodeAddress(
    stringToU8a(('modl' + seed).padEnd(32, '\0')),
    HYDRATION_SS58_PREFIX
  );
}

export class StakingApi {
  private readonly client: StakingClient;

  constructor(client: StakingClient) {
    this.client = client;
  }

  async getFreePotBalance(): Promise<bigint> {
    const palletId = await this.client.getPalletId();
    const potAddress = getHydraAccountAddress(palletId);
    return this.client.getBalance(potAddress);
  }

  async getStakingPosition(id: bigint) {
    const [positionData, votesRes] = await Promise.all([
      this.client.getStakingPositionsValue(id),
      this.client.getStakingVotes(id),
    ]);

    const createdAt = positionData?.created_at;

    const votes: Array<{
      id: number;
      amount: bigint;
      conviction: string;
    }> = await votesRes.reduce(async (acc, [key, data]) => {
      const prevAcc = await acc;
      const id = key;
      const amount = data.amount;
      const conviction = data.conviction.toString();

      const referendaInfo = await this.client.getReferendumInfo(id);

      if (!referendaInfo) return prevAcc;

      if (
        referendaInfo.type === 'Approved' ||
        referendaInfo.type === 'Rejected'
      ) {
        prevAcc.push({
          id,
          amount,
          conviction,
        });
      }

      return prevAcc;
    }, Promise.resolve<Array<{ id: number; amount: bigint; conviction: string }>>([]));

    return {
      stake: positionData?.stake,
      rewardPerStake: positionData?.reward_per_stake,
      createdAt,
      actionPoints: positionData?.action_points,
      accumulatedUnpaidRewards: positionData?.accumulated_unpaid_rewards,
      accumulatedSlashPoints: positionData?.accumulated_slash_points,
      accumulatedLockedRewards: positionData?.accumulated_locked_rewards,
      votes: votes,
    };
  }

  async getStake(address: string) {
    const collectionId = await this.client.getNFTCollectionId();

    const [staking, uniques] = await Promise.all([
      this.client.getStaking(),
      this.client.getUniques(address, collectionId),
    ]);

    const stakePositionId = uniques.find((nfts) => nfts)?.itemId;

    return {
      totalStake: staking?.total_stake,
      accumulatedRewardPerStake: staking?.accumulated_reward_per_stake,
      potReservedBalance: staking?.pot_reserved_balance,
      positionId: stakePositionId,
      stakePosition: stakePositionId
        ? await this.getStakingPosition(stakePositionId)
        : undefined,
    };
  }

  async getRewards(account: string): Promise<string | undefined> {
    const stake = await this.getStake(account);

    const {
      potReservedBalance,
      accumulatedRewardPerStake,
      totalStake,
      stakePosition,
    } = stake;

    if (!stakePosition) {
      return undefined;
    }

    const [
      bestNumber,
      freePotbalance,
      periodLength,
      unclaimablePeriods,
      sixBlockSince,
    ] = await Promise.all([
      this.client.getBlockNumber(),
      this.getFreePotBalance(),
      this.client.getPeriodLength(),
      this.client.getUnclaimablePeriods(),
      this.client.getSixBlockSince(),
    ]);

    const pendingRewards = Big(freePotbalance.toString()).minus(
      potReservedBalance.toString()
    );

    let rewardPerStake = accumulatedRewardPerStake.toString();
    const currentBlokNumber = bestNumber.toString();
    const sixBlockFallback = Big(currentBlokNumber).plus(1).toString();

    if (pendingRewards.gt(0) && totalStake > 0) {
      rewardPerStake = calculate_accumulated_rps(
        accumulatedRewardPerStake.toString(),
        pendingRewards.toString(),
        totalStake.toString()
      );
    }

    const currentPeriod = calculate_period_number(
      periodLength.toString(),
      currentBlokNumber,
      sixBlockSince ?? sixBlockFallback
    );

    const enteredAt = calculate_period_number(
      periodLength.toString(),
      stakePosition.createdAt?.toString() ?? '',
      sixBlockSince ?? sixBlockFallback
    );

    const maxRewards = calculate_rewards(
      rewardPerStake,
      stakePosition.rewardPerStake?.toString() ?? '',
      stakePosition.stake?.toString() ?? ''
    );

    const totalRewards = Big(maxRewards)
      .plus(stakePosition.accumulatedUnpaidRewards?.toString() || '0')
      .plus(stakePosition.accumulatedLockedRewards?.toString() || '0');

    if (
      Big(currentPeriod).minus(enteredAt).lte(unclaimablePeriods.toString())
    ) {
      return undefined;
    }

    return totalRewards.div(BIG_BILL).toString();
  }
}
