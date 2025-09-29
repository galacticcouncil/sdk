import { AccountId, SS58String } from 'polkadot-api';

import Big from 'big.js';

import { fixed_from_rational } from '@galacticcouncil/math-liquidity-mining';

import {
  HYDRATION_SS58_PREFIX,
  RUNTIME_DECIMALS,
  SYSTEM_ASSET_ID,
} from '../consts';
import { BalanceClient } from '../client';
import { Balance } from '../types';
import { fmt } from '../utils';

import { LiquidityMiningClient } from './LiquidityMiningClient';
import { MultiCurrencyContainer } from './MultiCurrencyContainer';
import { RewardClaimSimulator } from './RewardClaimSimulator';

import { DEFAULT_ORACLE_PRICE, DEFAULT_BLOCK_TIME } from './const';
import {
  OmnipoolFarm,
  OmnipoolWarehouseLMDepositYieldFarmEntry,
} from './types';

const secondsInYear = Big(365.2425).times(24).times(60).times(60);

export type LiquidityMiningOptions = {
  blockTime?: number;
};

export class LiquidityMiningApi {
  private readonly client: LiquidityMiningClient;
  private readonly balanceClient: BalanceClient;
  private readonly options: LiquidityMiningOptions;

  constructor(
    client: LiquidityMiningClient,
    balanceClient: BalanceClient,
    options: LiquidityMiningOptions = {}
  ) {
    this.client = client;
    this.balanceClient = balanceClient;
    this.options = Object.freeze({
      blockTime: options.blockTime ?? DEFAULT_BLOCK_TIME,
    });
  }

  get blockTime(): number {
    return this.options.blockTime!;
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
    farm: OmnipoolFarm,
    relayBlockNumber: number,
    isXyk?: boolean
  ) {
    const { yieldFarm, globalFarm, priceAdjustment, balance, id } = farm;
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

    const priceAdjustmentShifted = fmt.shiftNeg(
      priceAdjustment ?? price_adjustment,
      RUNTIME_DECIMALS
    );
    const multiplierShifted = fmt.shiftNeg(multiplier, RUNTIME_DECIMALS);
    const loyaltyFactorShifted = fmt.shiftNeg(
      loyaltyCurve?.initial_reward_percentage ?? 0,
      RUNTIME_DECIMALS
    );

    const periodsPerYear = secondsInYear
      .div(Big(this.blockTime).times(blocks_per_period))
      .toString();

    let apr: string;

    if (total_shares_z <= 0) {
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
      yieldFarmId: yieldFarm.id,
      globalFarmId: globalFarm.id,
      poolId: id,
    };
  }

  async getAllOmnipoolFarms() {
    const activeYieldFarmIds = await this.client.getAllOmnipooFarms();

    const poolIds = activeYieldFarmIds.reduce<string[]>(
      (acc, activeYieldFarmId) =>
        acc.includes(activeYieldFarmId.keyArgs[0].toString())
          ? acc
          : [...acc, activeYieldFarmId.keyArgs[0].toString()],
      []
    );

    return Promise.all(
      poolIds.map(async (poolId) => await this.getOmnipoolFarms(poolId))
    );
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
        };
      })
    );

    return relayBlockNumber
      ? farms.map((farm) =>
          farm ? this.farmData(farm, relayBlockNumber) : undefined
        )
      : [];
  }

  async getAllIsolatedFarms() {
    const activeYieldFarmIds = await this.client.getAllIsolatedFarms();

    const poolIds = activeYieldFarmIds.reduce<string[]>(
      (acc, activeYieldFarmId) =>
        acc.includes(activeYieldFarmId.keyArgs[0].toString())
          ? acc
          : [...acc, activeYieldFarmId.keyArgs[0].toString()],
      []
    );

    return Promise.all(
      poolIds.map(async (poolId) => await this.getIsolatedFarms(poolId))
    );
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

  async getDepositReward(
    poolId: string,
    farmEntry: OmnipoolWarehouseLMDepositYieldFarmEntry,
    isXyk: boolean,
    relayChainBlockNumber: number
  ) {
    const globalFarmId = farmEntry.global_farm_id;
    const yieldFarmId = farmEntry.yield_farm_id;

    const yieldFarm = isXyk
      ? await this.client.getIsolatedYieldFarm(
          poolId,
          globalFarmId,
          yieldFarmId
        )
      : await this.client.getOmnipoolYieldFarm(
          Number(poolId),
          globalFarmId,
          yieldFarmId
        );
    const globalFarm = isXyk
      ? await this.client.getIsolatedGlobalFarm(globalFarmId)
      : await this.client.getOmnipoolGlobalFarm(globalFarmId);

    if (!globalFarm || !yieldFarm) return undefined;

    const rewardCurrency = globalFarm.reward_currency;
    const incentivizedAsset = globalFarm.incentivized_asset;

    const accountAddresses: Array<[address: string, assetId: number]> = [
      [this.getFarmAddress(0, isXyk), globalFarm.reward_currency],
      [this.getFarmAddress(globalFarm.id, isXyk), globalFarm.reward_currency],
    ];

    const balances = await this.getAccountAssetBalances(accountAddresses);

    const oracles = await this.getOraclePrice(
      rewardCurrency,
      incentivizedAsset
    );

    const multiCurrency = new MultiCurrencyContainer(
      accountAddresses,
      balances
    );

    const simulator = new RewardClaimSimulator(
      (sub) => this.getFarmAddress(sub),
      (id) => this.client.getAsset(id),
      multiCurrency
    );

    const reward = await simulator.claimRewards(
      globalFarm,
      yieldFarm,
      farmEntry,
      relayChainBlockNumber,
      oracles ?? globalFarm.price_adjustment
    );

    if (!reward) {
      return undefined;
    }

    const meta = await this.client.getAsset(reward.assetId);

    if (!meta) {
      return undefined;
    }

    if (reward.reward <= meta.existential_deposit) {
      return undefined;
    }

    return reward;
  }

  async getAccountAssetBalances(
    pairs: Array<[address: string, assetId: number]>
  ) {
    const [tokens, natives] = await Promise.all([
      Promise.all(
        pairs
          .filter(([_, assetId]) => assetId !== SYSTEM_ASSET_ID)
          .map(([account, assetId]) =>
            this.balanceClient.getTokenBalance(account, assetId)
          )
      ),
      Promise.all(
        pairs
          .filter(([_, assetId]) => assetId === SYSTEM_ASSET_ID)
          .map(([account]) => this.balanceClient.getSystemBalance(account))
      ),
    ]);

    const values: Array<Balance> = [];
    for (
      let tokenIdx = 0, nativeIdx = 0;
      tokenIdx + nativeIdx < pairs.length;

    ) {
      const idx = tokenIdx + nativeIdx;
      const [, assetId] = pairs[idx];

      if (assetId === SYSTEM_ASSET_ID) {
        values.push(natives[nativeIdx]);

        nativeIdx += 1;
      } else {
        values.push(tokens[tokenIdx]);

        tokenIdx += 1;
      }
    }

    return values;
  }
}
