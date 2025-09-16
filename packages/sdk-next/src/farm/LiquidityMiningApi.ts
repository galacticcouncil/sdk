import {
  AccountId,
  Binary,
  Enum,
  PolkadotClient,
  SS58String,
} from 'polkadot-api';
import { fixed_from_rational } from '@galacticcouncil/math-liquidity-mining';
import Big from 'big.js';

import { HYDRATION_SS58_PREFIX, RUNTIME_DECIMALS } from '../consts';

import { Papi } from '../api';
import { BalanceClient } from '../client/BalanceClient';
import { HydrationQueries } from '@galacticcouncil/descriptors';
import { shiftNeg } from '../utils/format';
import { Balance } from 'types';
import { LiquidityMiningClient } from './LiquidityMiningClient';

const secondsInYear = Big(365.2425).times(24).times(60).times(60);

type OmnipoolGlobalFarm =
  HydrationQueries['OmnipoolWarehouseLM']['GlobalFarm']['Value'];
type OmnipoolYieldFarm =
  HydrationQueries['OmnipoolWarehouseLM']['YieldFarm']['Value'];

type OmnipolFarm = {
  id: string;
  globalFarm: OmnipoolGlobalFarm;
  yieldFarm: OmnipoolYieldFarm;
  priceAdjustment: bigint | undefined;
  balance: Balance;
};

const DEFAULT_ORACLE_PRICE = BigInt(Big(1).pow(18).toString());
const blockTime = 6;

export class LiquidityMiningApi {
  private readonly client: LiquidityMiningClient;
  private readonly balanceClient: BalanceClient;

  protected omnipoolAssetIds: string[] = [];

  constructor(client: LiquidityMiningClient, balanceClient: BalanceClient) {
    this.client = client;
    this.balanceClient = balanceClient;
  }

  async getOraclePrice(
    rewardCurrency: number,
    incentivizedAsset: number
  ): Promise<bigint | undefined> {
    const orderedAssets = [rewardCurrency, incentivizedAsset].sort(
      (a, b) => a - b
    ) as [number, number];

    if (rewardCurrency === incentivizedAsset) return DEFAULT_ORACLE_PRICE;

    const res = await this.client.getOraclePrice(orderedAssets);

    if (res) {
      const { n, d } = res[0].price;

      let oraclePrice;
      if (rewardCurrency < incentivizedAsset) {
        oraclePrice = fixed_from_rational(n.toString(), d.toString());
      } else {
        oraclePrice = fixed_from_rational(d.toString(), n.toString());
      }

      return BigInt(oraclePrice);
    }

    return undefined;
  }

  private getFarmAddress = (
    globalFarmId: number,
    isXyk?: boolean
  ): SS58String => {
    const TYPE_ID = Buffer.from('modl', 'utf-8');
    const PALLET_ID = Buffer.from(
      isXyk ? '78796b4c4d704944' : '4f6d6e6957684c4d',
      'hex'
    );

    const FARM_ID = Buffer.from([globalFarmId]);
    const full = Buffer.concat([TYPE_ID, PALLET_ID, FARM_ID]);
    const padded = Buffer.concat([full, Buffer.alloc(32 - full.length)]);

    const nameHex = '0x' + padded.toString('hex');

    return AccountId(HYDRATION_SS58_PREFIX).dec(nameHex);
  };

  private getGlobalRewardPerPeriod(
    totalSharesZ: bigint,
    yieldPerPeriod: bigint,
    maxRewardPerPeriod: bigint,
    priceAdjustemnt: string
  ) {
    const globalRewardPerPeriod = Big(priceAdjustemnt)
      .times(totalSharesZ.toString())
      .times(yieldPerPeriod.toString())
      .div(RUNTIME_DECIMALS);

    return globalRewardPerPeriod.gte(maxRewardPerPeriod.toString())
      ? maxRewardPerPeriod.toString()
      : globalRewardPerPeriod.toString();
  }

  private getPoolYieldPerPeriod(
    globalRewardPerPeriod: string,
    multiplier: string,
    totalSharesZ: bigint,
    priceAdjustment: string
  ) {
    const numerator = Big(globalRewardPerPeriod.toString()).times(multiplier);
    const denominator = Big(totalSharesZ.toString()).times(priceAdjustment);

    return numerator.div(denominator.toString()).toString();
  }

  private farmData(
    farm: OmnipolFarm,
    relayBlockNumber: number,
    isXyk?: boolean
  ) {
    const { yieldFarm, globalFarm, priceAdjustment, balance } = farm;
    const { multiplier, loyalty_curve: loyaltyCurve } = yieldFarm;
    const {
      blocks_per_period,
      yield_per_period,
      total_shares_z,
      max_reward_per_period,
      pending_rewards,
      accumulated_paid_rewards,
      planned_yielding_periods,
      updated_at,
      incentivized_asset: incentivizedAsset,
      reward_currency: rewardCurrency,
      price_adjustment,
    } = globalFarm;

    const priceAdjustmentShifted = shiftNeg(
      priceAdjustment ?? price_adjustment,
      RUNTIME_DECIMALS
    );
    const multiplierShifted = shiftNeg(multiplier, RUNTIME_DECIMALS);
    const loyaltyFactorShifted = shiftNeg(
      loyaltyCurve?.initial_reward_percentage ?? 0,
      RUNTIME_DECIMALS
    );

    const periodsPerYear = secondsInYear
      .div(Big(blockTime).times(blocks_per_period))
      .toString();

    let apr: string;

    if (total_shares_z < 0) {
      apr = Big(multiplierShifted)
        .times(yield_per_period.toString())
        .times(periodsPerYear)
        .toString();
    } else {
      const globalRewardPerPeriod = this.getGlobalRewardPerPeriod(
        total_shares_z,
        yield_per_period,
        max_reward_per_period,
        priceAdjustmentShifted
      );

      const poolYieldPerPeriod = this.getPoolYieldPerPeriod(
        globalRewardPerPeriod,
        multiplierShifted,
        total_shares_z,
        priceAdjustmentShifted
      );

      apr = Big(poolYieldPerPeriod).times(periodsPerYear).toString();
    }

    const distributedRewards = pending_rewards + accumulated_paid_rewards;
    const maxRewards = max_reward_per_period * BigInt(planned_yielding_periods);
    const potMaxRewards = balance.transferable + distributedRewards;
    const leftToDistribute = potMaxRewards - distributedRewards;

    const periodsLeft = Big(leftToDistribute.toString()).div(
      max_reward_per_period.toString()
    );

    const currentPeriod = Big(relayBlockNumber)
      .div(blocks_per_period.toString())
      .toString();

    const estimatedEndPeriod = (
      total_shares_z >= 0
        ? periodsLeft.plus(updated_at)
        : periodsLeft.plus(currentPeriod)
    ).toString();

    const fullness = Big(total_shares_z.toString())
      .div(
        Big(max_reward_per_period.toString()).div(yield_per_period.toString())
      )
      .div(Math.pow(10, RUNTIME_DECIMALS))
      .times(100)
      .times(priceAdjustmentShifted)
      .toFixed(2);

    const isDistributed = Big(distributedRewards.toString())
      .div(potMaxRewards.toString())
      .gte(0.999);

    apr = isDistributed
      ? '0'
      : Big(apr)
          .div(isXyk ? 2 : 1)
          .times(100)
          .toString();

    const minApr = loyaltyFactorShifted
      ? Big(apr).times(loyaltyFactorShifted).toString()
      : undefined;

    return {
      apr,
      minApr,
      isDistributed,
      estimatedEndPeriod,
      maxRewards,
      incentivizedAsset,
      rewardCurrency,
      loyaltyCurve,
      currentPeriod,
      potMaxRewards,
      fullness,
    };
  }

  async getOmnipoolFarms(id: string) {
    const activeYieldFarmIds = await this.client.getOmnipooFarms(Number(id));
    const relayBlockNumber = await this.client.getRelayBlockNumber();

    const farms = await Promise.all(
      activeYieldFarmIds.map(async ({ keyArgs, value }) => {
        const [, globalFarmId] = keyArgs;
        const yieldFarmId = value;

        const globalFarm =
          await this.client.getOmnipoolGlobalFarm(globalFarmId);

        const yieldFarm = await this.client.getOmnipoolYieldFarm(
          Number(id),
          globalFarmId,
          yieldFarmId
        );

        if (!globalFarm || !yieldFarm) return undefined;

        const rewardCurrency = globalFarm.reward_currency;
        const incentivizedAsset = globalFarm.incentivized_asset;
        const farmAddress = this.getFarmAddress(globalFarmId);

        const priceAdjustment = await this.getOraclePrice(
          rewardCurrency,
          incentivizedAsset
        );

        const balance = await this.balanceClient.getTokenBalance(
          farmAddress,
          rewardCurrency
        );

        return {
          id,
          globalFarm,
          yieldFarm,
          priceAdjustment,
          balance,
        };
      })
    );

    return relayBlockNumber
      ? farms.map((farm) =>
          farm ? this.farmData(farm, relayBlockNumber) : undefined
        )
      : [];
  }

  async getIsolatedFarms(id: string) {
    const activeYieldFarmIds = await this.client.getIsolatedFarms(id);
    const relayBlockNumber = await this.client.getRelayBlockNumber();

    const farms = await Promise.all(
      activeYieldFarmIds.map(async ({ keyArgs, value }) => {
        const [, globalFarmId] = keyArgs;
        const yieldFarmId = value;

        const globalFarm =
          await this.client.getIsolatedGlobalFarm(globalFarmId);

        const yieldFarm = await this.client.getIsolatedYieldFarm(
          id,
          globalFarmId,
          yieldFarmId
        );

        if (!globalFarm || !yieldFarm) return undefined;

        const rewardCurrency = globalFarm.reward_currency;
        const incentivizedAsset = globalFarm.incentivized_asset;
        const farmAddress = this.getFarmAddress(globalFarmId, true);

        const priceAdjustment = await this.getOraclePrice(
          rewardCurrency,
          incentivizedAsset
        );

        const balance = await this.balanceClient.getBalance(
          farmAddress,
          rewardCurrency
        );

        return {
          id,
          globalFarm,
          yieldFarm,
          priceAdjustment,
          balance,
          farmAddress,
        };
      })
    );

    return relayBlockNumber
      ? farms.map((farm) =>
          farm ? this.farmData(farm, relayBlockNumber, true) : undefined
        )
      : [];
  }
}
