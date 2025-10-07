import { HYDRATION_SS58_PREFIX, SYSTEM_ASSET_ID } from '../consts';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';
import {
  calculate_accumulated_rps,
  calculate_percentage_amount,
  calculate_period_number,
  calculate_points,
  calculate_rewards,
  sigmoid,
} from '@galacticcouncil/math-staking';
import Big from 'big.js';
import { StakingClient } from './StakingClient';
import { BalanceClient } from 'client';
import { Balance } from 'types';

const CONVICTIONS = {
  none: 0.1,
  locked1x: 1,
  locked2x: 2,
  locked3x: 3,
  locked4x: 4,
  locked5x: 5,
  locked6x: 6,
} as const satisfies { [key: string]: number };

type Conviction = keyof typeof CONVICTIONS;

const isConviction = (conviction: string): conviction is Conviction =>
  Object.keys(CONVICTIONS).includes(conviction);

type TVote = {
  id: number;
  amount: bigint;
  conviction: Conviction;
};

/* constants that might be changed */
const a = '20000000000000000';
const b = '2000';

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
  private readonly balanceClient: BalanceClient;

  constructor(client: StakingClient, balanceClient: BalanceClient) {
    this.client = client;
    this.balanceClient = balanceClient;
  }

  async getPotBalance(): Promise<Balance> {
    const palletId = await this.client.getPalletId();
    const potAddress = getHydraAccountAddress(palletId);
    const balance = await this.balanceClient.getBalance(
      potAddress,
      SYSTEM_ASSET_ID
    );
    return balance;
  }

  async getStakingPosition(id: bigint) {
    const [positionData, votesRes] = await Promise.all([
      this.client.getStakingPositionsValue(id),
      this.client.getStakingVotes(id),
    ]);

    if (!positionData) {
      return undefined;
    }

    const createdAt = positionData.created_at;

    const votes: Array<TVote> = await votesRes.reduce(
      async (acc, [key, data]) => {
        const prevAcc = await acc;
        const id = key;
        const amount = data.amount;
        const conviction = data.conviction.toString().toLowerCase();

        const referendaInfo = await this.client.getReferendumInfo(id);

        if (!referendaInfo) return prevAcc;

        if (
          (referendaInfo.type === 'Approved' ||
            referendaInfo.type === 'Rejected') &&
          isConviction(conviction)
        ) {
          prevAcc.push({
            id,
            amount,
            conviction,
          });
        }

        return prevAcc;
      },
      Promise.resolve<Array<TVote>>([])
    );

    return {
      stake: positionData.stake,
      rewardPerStake: positionData.reward_per_stake,
      createdAt,
      actionPoints: positionData.action_points,
      accumulatedUnpaidRewards: positionData.accumulated_unpaid_rewards,
      accumulatedSlashPoints: positionData.accumulated_slash_points,
      accumulatedLockedRewards: positionData.accumulated_locked_rewards,
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

  getCurrentActionPoints(
    votes: TVote[],
    initialActionPoints: bigint,
    stakePosition: bigint,
    activeReferendaIds: string[]
  ) {
    let currentActionPoints = Big(0);
    let maxActionPoints = Big(0);

    const maxConviction = CONVICTIONS['locked6x'];
    const maxVotingPower = Big(stakePosition.toString()).mul(maxConviction);
    const maxActionPointsPerRef = 100;

    const votedActiveReferendaIds: string[] = [];

    votes.forEach((vote) => {
      const convictionIndex = CONVICTIONS[vote.conviction];

      const isActiveReferenda = activeReferendaIds.includes(vote.id.toString());

      if (isActiveReferenda) {
        votedActiveReferendaIds.push(vote.id.toString());
      }

      const actionPointsBase = Big(vote.amount.toString())
        .mul(maxActionPointsPerRef)
        .div(maxVotingPower);

      currentActionPoints = currentActionPoints.plus(
        Math.floor(actionPointsBase.mul(convictionIndex).toNumber())
      );

      maxActionPoints = maxActionPoints.plus(
        Math.floor(
          actionPointsBase
            .mul(isActiveReferenda ? maxConviction : convictionIndex)
            .toNumber()
        )
      );
    });

    const stakePositionAddition = Math.floor(
      Big(stakePosition.toString())
        .mul(maxConviction)
        .mul(maxActionPointsPerRef)
        .div(maxVotingPower)
        .toNumber()
    );

    activeReferendaIds.forEach((activeReferendaId) => {
      if (!votedActiveReferendaIds.includes(activeReferendaId)) {
        maxActionPoints = maxActionPoints.plus(stakePositionAddition);
      }
    });

    const actionMultipliers = {
      democracyVote: 1,
    };

    currentActionPoints = currentActionPoints.mul(
      actionMultipliers.democracyVote
    );
    currentActionPoints = currentActionPoints.plus(
      initialActionPoints.toString() || '0'
    );

    maxActionPoints = maxActionPoints.mul(actionMultipliers.democracyVote);
    maxActionPoints = maxActionPoints.plus(
      initialActionPoints.toString() || '0'
    );

    return {
      currentActionPoints: currentActionPoints.toString(),
      maxActionPoints: maxActionPoints.toString(),
    };
  }

  async getRewards(
    account: string,
    activeReferendaIds: Array<string>,
    blockNumber: string
  ) {
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
      potBalance,
      periodLength,
      unclaimablePeriods,
      timePointsPerPeriod,
      timePointsWeight,
      actionPointsWeight,
      sixBlockSince,
    ] = await Promise.all([
      this.getPotBalance(),
      this.client.getPeriodLength(),
      this.client.getUnclaimablePeriods(),
      this.client.getTimePointsPerPeriod(),
      this.client.getTimePointsWeight(),
      this.client.getActionPointsWeight(),
      this.client.getSixBlockSince(),
    ]);

    const pendingRewards = Big(potBalance.transferable.toString()).minus(
      potReservedBalance.toString()
    );

    const rewardPerStake =
      pendingRewards.gt(0) && totalStake > 0
        ? calculate_accumulated_rps(
            accumulatedRewardPerStake.toString(),
            pendingRewards.toString(),
            totalStake.toString()
          )
        : accumulatedRewardPerStake.toString();

    const currentPeriod = calculate_period_number(
      periodLength.toString(),
      blockNumber,
      sixBlockSince
    );

    const enteredAt = calculate_period_number(
      periodLength.toString(),
      stakePosition.createdAt.toString(),
      sixBlockSince
    );

    const maxRewards = calculate_rewards(
      rewardPerStake,
      stakePosition.rewardPerStake.toString(),
      stakePosition.stake.toString()
    );

    const actionPoints = this.getCurrentActionPoints(
      stakePosition.votes,
      stakePosition.actionPoints,
      stakePosition.stake,
      activeReferendaIds
    );

    const points = calculate_points(
      enteredAt,
      currentPeriod,
      timePointsPerPeriod.toString(),
      timePointsWeight.toString(),
      actionPoints.currentActionPoints,
      actionPointsWeight.toString(),
      stakePosition.accumulatedSlashPoints.toString()
    );

    const payablePercentage = sigmoid(points, a, b);

    const totalRewards = Big(maxRewards)
      .plus(stakePosition.accumulatedUnpaidRewards.toString())
      .plus(stakePosition.accumulatedLockedRewards.toString());

    if (
      Big(currentPeriod).minus(enteredAt).lte(unclaimablePeriods.toString())
    ) {
      return { rewards: '0' };
    }

    const userRewards = calculate_percentage_amount(
      totalRewards.toString(),
      payablePercentage
    );

    const accumulatedLockedRewardsBig = Big(
      stakePosition.accumulatedLockedRewards.toString()
    );

    const availabeRewards = accumulatedLockedRewardsBig.gt(userRewards)
      ? accumulatedLockedRewardsBig
      : Big(userRewards);

    return {
      rewards: availabeRewards.div(BIG_BILL).toString(),
      maxRewards: totalRewards.div(BIG_BILL).toString(),
      allocatedRewardsPercentage: availabeRewards
        .div(totalRewards)
        .mul(100)
        .toNumber(),
    };
  }
}
