import Big from 'big.js';
import {
  calculate_accumulated_rps,
  calculate_global_farm_rewards,
  calculate_loyalty_multiplier,
  calculate_user_reward,
  calculate_yield_farm_delta_rpvs,
} from '@galacticcouncil/math-liquidity-mining';
import {
  BN_QUINTILL,
  FarmDepositReward,
  IsolatedGlobalFarm,
  ISolatedYieldFarm,
  OmnipoolGlobalFarm,
  OmnipoolWarehouseLMDepositYieldFarmEntry,
  OmnipoolYieldFarm,
} from './LiquidityMiningApi';
import { MultiCurrencyContainer } from './multiCurrencyContainer';

const MAX_LOYALTY_FACTOR = '1000000000000000000';

type GlobalFarm = OmnipoolGlobalFarm | IsolatedGlobalFarm;
type YieldFarm = OmnipoolYieldFarm | ISolatedYieldFarm;

export class OmnipoolLiquidityMiningClaimSim {
  constructor(
    protected getAccount: (sub: number) => string,
    protected multiCurrency: MultiCurrencyContainer,
    protected getAsset: (id: number) => Promise<
      | {
          existential_deposit: bigint;
        }
      | undefined
    >
  ) {}

  async syncGlobalFarm(
    globalFarm: GlobalFarm,
    currentPeriod: number,
    oraclePrice: bigint
  ): Promise<GlobalFarm | null> {
    // Inactive farm should not be updated
    if (globalFarm.state.type !== 'Active') {
      return null;
    }

    // Farm should be updated only once in the same period.
    if (globalFarm.updated_at === currentPeriod) {
      return null;
    }

    // Nothing to update if there is no stake in the farm.
    if (globalFarm.total_shares_z === 0n) {
      return globalFarm;
    }

    const rewardAsset = await this.getAsset(globalFarm.reward_currency);

    // Number of periods since last farm update.
    const periodsSinceLastUpdate = currentPeriod - globalFarm.updated_at;
    const globalFarmAccount = this.getAccount(globalFarm.id);
    const rewardCurrencyEd = rewardAsset?.existential_deposit;

    if (!rewardCurrencyEd) {
      throw new Error('Missing reward currency asset list');
    }

    const globalFarmBalance = this.multiCurrency.freeBalance(
      globalFarm.reward_currency,
      globalFarmAccount
    );
    // saturating sub
    const rewardCurrencyEdBig = Big(rewardCurrencyEd.toString());
    const leftToDistribute = Big(globalFarmBalance.toString()).minus(
      rewardCurrencyEdBig.lt(globalFarmBalance.toString())
        ? rewardCurrencyEd.toString()
        : globalFarmBalance.toString()
    );

    let reward = Big(
      calculate_global_farm_rewards(
        globalFarm.total_shares_z.toString(),
        oraclePrice.toString(),
        Big(globalFarm.yield_per_period.toString())
          .mul(BN_QUINTILL)
          .round(0, Big.roundDown)
          .toFixed(),
        globalFarm.max_reward_per_period.toString(),
        periodsSinceLastUpdate.toFixed()
      )
    );

    if (leftToDistribute.lt(reward)) {
      reward = leftToDistribute;
    }

    if (reward.eq(0)) {
      return globalFarm;
    }

    const pot = this.getAccount(0);

    this.multiCurrency.transfer(
      globalFarm.reward_currency,
      globalFarmAccount,
      pot,
      BigInt(reward.toFixed())
    );

    return {
      ...globalFarm,
      accumulated_rpz: BigInt(
        calculate_accumulated_rps(
          globalFarm.accumulated_rpz.toString(),
          globalFarm.total_shares_z.toString(),
          reward.toFixed()
        )
      ),
    } satisfies GlobalFarm;
  }

  syncYieldFarm(
    yieldFarm: YieldFarm,
    globalFarm: GlobalFarm,
    currentPeriod: number
  ): YieldFarm | null {
    if (yieldFarm.state.type !== 'Active') {
      return null;
    }

    if (yieldFarm.updated_at === currentPeriod) {
      return null;
    }

    if (yieldFarm.total_valued_shares === 0n) {
      return {
        ...yieldFarm,
        updated_at: currentPeriod,
      };
    }

    const deltaRpvs = calculate_yield_farm_delta_rpvs(
      yieldFarm.accumulated_rpz.toString(),
      globalFarm.accumulated_rpz.toString(),
      yieldFarm.multiplier.toString(),
      yieldFarm.total_valued_shares.toString()
    );

    return {
      ...yieldFarm,
      accumulated_rpvs: yieldFarm.accumulated_rpvs + BigInt(deltaRpvs),
      updated_at: currentPeriod,
    };
  }

  getLoyaltyMultiplier(
    periods: number,
    loyaltyCurve: YieldFarm['loyalty_curve']
  ) {
    const loyaltyMultiplier = Big(1)
      .mul(BN_QUINTILL)
      .round(0, Big.roundDown)
      .toString();

    if (!loyaltyCurve) {
      return loyaltyMultiplier;
    }

    const { initial_reward_percentage, scale_coef } = loyaltyCurve;

    return calculate_loyalty_multiplier(
      periods.toFixed(),
      initial_reward_percentage.toString(),
      scale_coef.toFixed()
    )!;
  }

  async claimRewards(
    globalFarm: GlobalFarm,
    yieldFarm: YieldFarm,
    farmEntry: OmnipoolWarehouseLMDepositYieldFarmEntry,
    relaychainBlockNumber: number,
    oraclePrice: bigint
  ): Promise<FarmDepositReward | null> {
    // if yield farm is terminated, cannot claim
    if (yieldFarm.state.type === 'Terminated') {
      return null;
    }

    const currentPeriod = Math.floor(
      relaychainBlockNumber / globalFarm.blocks_per_period
    );

    // avoid double claiming, if possible
    if (farmEntry.updated_at === currentPeriod) {
      return null;
    }

    const syncedGlobalFarm = await this.syncGlobalFarm(
      globalFarm,
      currentPeriod,
      oraclePrice
    );

    if (!syncedGlobalFarm) {
      return null;
    }

    const syncedYieldFarm = this.syncYieldFarm(
      yieldFarm,
      syncedGlobalFarm,
      currentPeriod
    );

    if (!syncedYieldFarm) {
      return null;
    }

    const deltaStopped =
      syncedYieldFarm.total_stopped - farmEntry.stopped_at_creation;

    const periods =
      syncedYieldFarm.updated_at - farmEntry.entered_at - deltaStopped;

    // calculate loyalty multiplier
    const loyaltyMultiplier = this.getLoyaltyMultiplier(
      periods,
      syncedYieldFarm.loyalty_curve
    );

    const reward = BigInt(
      calculate_user_reward(
        farmEntry.accumulated_rpvs.toString(),
        farmEntry.valued_shares.toString(),
        farmEntry.accumulated_claimed_rewards.toString(),
        syncedYieldFarm.accumulated_rpvs.toString(),
        loyaltyMultiplier
      )
    );

    const maxReward = BigInt(
      calculate_user_reward(
        farmEntry.accumulated_rpvs.toString(),
        farmEntry.valued_shares.toString(),
        farmEntry.accumulated_claimed_rewards.toString(),
        syncedYieldFarm.accumulated_rpvs.toString(),
        MAX_LOYALTY_FACTOR
      )
    );

    return {
      reward,
      maxReward,
      assetId: syncedGlobalFarm.reward_currency,
    };
  }
}
