import { TypedApi } from 'polkadot-api';
import {
  BN_QUINTILL,
  FarmDepositReward,
  MultiCurrencyContainer,
  OmnipoolWarehouseLMDepositYieldFarmEntry,
} from './LiquidityMiningClient';
import { hydration } from '@galacticcouncil/descriptors';
import Big from 'big.js';
import {
  calculate_accumulated_rps,
  calculate_global_farm_rewards,
  calculate_loyalty_multiplier,
  calculate_user_reward,
  calculate_yield_farm_delta_rpvs,
} from '@galacticcouncil/math-liquidity-mining';

const MAX_LOYALTY_FACTOR = '1000000000000000000';

type Api = TypedApi<typeof hydration>;
type NotUndefined<T> = T extends undefined ? never : T;

type GlobalFarm = NotUndefined<
  Awaited<
    ReturnType<
      | Api['query']['XYKWarehouseLM']['GlobalFarm']['getValue']
      | Api['query']['OmnipoolWarehouseLM']['GlobalFarm']['getValue']
    >
  >
>;

type YieldFarm = NotUndefined<
  Awaited<
    ReturnType<
      | Api['query']['XYKWarehouseLM']['YieldFarm']['getValue']
      | Api['query']['OmnipoolWarehouseLM']['YieldFarm']['getValue']
    >
  >
>;

export class OmnipoolLiquidityMiningClaimSim {
  constructor(
    protected get_account: (sub: number) => string,
    protected multiCurrency: MultiCurrencyContainer,
    protected getAsset: (id: number) => Promise<
      | {
          existential_deposit: bigint;
        }
      | undefined
    >
  ) {}

  async sync_global_farm(
    global_farm: GlobalFarm,
    current_period: number,
    oraclePrice: bigint
  ): Promise<GlobalFarm | null> {
    // Inactive farm should not be updated
    if (global_farm.state.type !== 'Active') {
      return null;
    }

    // Farm should be updated only once in the same period.
    if (global_farm.updated_at === current_period) {
      return null;
    }

    // Nothing to update if there is no stake in the farm.
    if (global_farm.total_shares_z === 0n) {
      return global_farm;
    }

    const rewardAsset = await this.getAsset(global_farm.reward_currency);

    // Number of periods since last farm update.
    const periods_since_last_update = current_period - global_farm.updated_at;
    const global_farm_account = this.get_account(global_farm.id);
    const reward_currency_ed = rewardAsset?.existential_deposit;

    if (!reward_currency_ed) {
      throw new Error('Missing reward currency asset list');
    }

    const global_farm_balance = this.multiCurrency.free_balance(
      global_farm.reward_currency,
      global_farm_account
    );
    // saturating sub
    const reward_currency_edBig = Big(reward_currency_ed.toString());
    const left_to_distribute = Big(global_farm_balance.toString()).minus(
      reward_currency_edBig.lt(global_farm_balance.toString())
        ? reward_currency_ed.toString()
        : global_farm_balance.toString()
    );

    let reward = Big(
      calculate_global_farm_rewards(
        global_farm.total_shares_z.toString(),
        oraclePrice.toString(),
        Big(global_farm.yield_per_period.toString())
          .mul(BN_QUINTILL)
          .round(0, Big.roundDown)
          .toFixed(),
        global_farm.max_reward_per_period.toString(),
        periods_since_last_update.toFixed()
      )
    );

    if (left_to_distribute.lt(reward)) {
      reward = left_to_distribute;
    }

    if (reward.eq(0)) {
      return global_farm;
    }

    const pot = this.get_account(0);

    this.multiCurrency.transfer(
      global_farm.reward_currency,
      global_farm_account,
      pot,
      BigInt(reward.toFixed())
    );

    return {
      ...global_farm,
      accumulated_rpz: BigInt(
        calculate_accumulated_rps(
          global_farm.accumulated_rpz.toString(),
          global_farm.total_shares_z.toString(),
          reward.toFixed()
        )
      ),
    } satisfies GlobalFarm;
  }

  sync_yield_farm(
    yield_farm: YieldFarm,
    global_farm: GlobalFarm,
    current_period: number
  ): YieldFarm | null {
    if (yield_farm.state.type !== 'Active') {
      return null;
    }

    if (yield_farm.updated_at === current_period) {
      return null;
    }

    if (yield_farm.total_valued_shares === 0n) {
      return {
        ...yield_farm,
        updated_at: current_period,
      };
    }

    const delta_rpvs = calculate_yield_farm_delta_rpvs(
      yield_farm.accumulated_rpz.toString(),
      global_farm.accumulated_rpz.toString(),
      yield_farm.multiplier.toString(),
      yield_farm.total_valued_shares.toString()
    );

    return {
      ...yield_farm,
      accumulated_rpvs: yield_farm.accumulated_rpvs + BigInt(delta_rpvs),
      updated_at: current_period,
    };
  }

  get_loyalty_multiplier(
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

  async claim_rewards(
    global_farm: GlobalFarm,
    yield_farm: YieldFarm,
    farmEntry: OmnipoolWarehouseLMDepositYieldFarmEntry,
    relaychainBlockNumber: number,
    oraclePrice: bigint
  ): Promise<FarmDepositReward | null> {
    // if yield farm is terminated, cannot claim
    if (yield_farm.state.type === 'Terminated') {
      return null;
    }

    const current_period = Math.floor(
      relaychainBlockNumber / global_farm.blocks_per_period
    );

    // avoid double claiming, if possible
    if (farmEntry.updated_at === current_period) {
      return null;
    }

    const syncedGlobalFarm = await this.sync_global_farm(
      global_farm,
      current_period,
      oraclePrice
    );

    if (!syncedGlobalFarm) {
      return null;
    }

    const syncedYielFarm = this.sync_yield_farm(
      yield_farm,
      syncedGlobalFarm,
      current_period
    );

    if (!syncedYielFarm) {
      return null;
    }

    const delta_stopped =
      syncedYielFarm.total_stopped - farmEntry.stopped_at_creation;

    const periods =
      syncedYielFarm.updated_at - farmEntry.entered_at - delta_stopped;

    // calculate loyalty multiplier
    const loyaltyMultiplier = this.get_loyalty_multiplier(
      periods,
      syncedYielFarm.loyalty_curve
    );

    const reward = BigInt(
      calculate_user_reward(
        farmEntry.accumulated_rpvs.toString(),
        farmEntry.valued_shares.toString(),
        farmEntry.accumulated_claimed_rewards.toString(),
        syncedYielFarm.accumulated_rpvs.toString(),
        loyaltyMultiplier
      )
    );

    const maxReward = BigInt(
      calculate_user_reward(
        farmEntry.accumulated_rpvs.toString(),
        farmEntry.valued_shares.toString(),
        farmEntry.accumulated_claimed_rewards.toString(),
        syncedYielFarm.accumulated_rpvs.toString(),
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
