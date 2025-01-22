import { ApiPromise } from '@polkadot/api';
import { PalletLiquidityMiningGlobalFarmData } from '@polkadot/types/lookup';
import { isAddress } from '@polkadot/util-crypto';
import { fixed_from_rational } from '@galacticcouncil/math-liquidity-mining';
import { PolkadotApiClient } from './PolkadotApi';
import { BigNumber, ZERO } from '../utils/bignumber';
import { BalanceClient } from './BalanceClient';
import { Registry } from '@polkadot/types-codec/types';
import { u32 } from '@polkadot/types-codec';
import { GenericAccountId32 } from '@polkadot/types';
import { AccountId32 } from '@polkadot/types/interfaces';
import { u8aConcat } from '@polkadot/util';
import { U8aLike } from '@polkadot/util/types';

export class FarmClient extends PolkadotApiClient {
  protected readonly balanceClient: BalanceClient;

  constructor(api: ApiPromise) {
    super(api);
    this.balanceClient = new BalanceClient(api);
  }

  private secondsInYear = new BigNumber(365.2425).times(24).times(60).times(60);

  private async getOmnipoolFarms(assetId: string) {
    const activeYieldFarmIds =
      await this.api.query.omnipoolWarehouseLM.activeYieldFarm.entries(assetId);

    const farms = await Promise.all(
      activeYieldFarmIds.map(async ([storageKey, option]) => {
        const [, globalFarmIdRaw] = storageKey.args;

        const yieldFarmId = option.unwrap().toString();
        const globalFarmId = globalFarmIdRaw.toString();

        const globalFarm = (
          await this.api.query.omnipoolWarehouseLM.globalFarm(globalFarmId)
        ).unwrap();
        const yieldFarm = (
          await this.api.query.omnipoolWarehouseLM.yieldFarm(
            assetId,
            globalFarmId,
            yieldFarmId
          )
        ).unwrap();

        const priceAdjustment =
          (await this.getOraclePrice(globalFarm)) ??
          globalFarm.priceAdjustment.toString();

        const accountResolver = this.getAccountResolver(this.api.registry);
        const potAddress = accountResolver(
          Number(globalFarmId),
          false
        ).toString();
        const rewardCurrency = globalFarm.rewardCurrency.toString();

        const balance = await this.balanceClient.getTokenBalanceData(
          potAddress,
          rewardCurrency
        );

        return {
          assetId,
          globalFarm,
          yieldFarm,
          priceAdjustment,
          potBalance: balance.free.toString(),
        };
      })
    );

    return farms;
  }

  private async getIsolatedPoolFarms(assetId: string) {
    const activeYieldFarmIds =
      await this.api.query.xykWarehouseLM.activeYieldFarm.entries(assetId);

    const farms = await Promise.all(
      activeYieldFarmIds.map(async ([storageKey, option]) => {
        const [, globalFarmIdRaw] = storageKey.args;

        const yieldFarmId = option.unwrap().toString();
        const globalFarmId = globalFarmIdRaw.toString();

        const globalFarm = (
          await this.api.query.xykWarehouseLM.globalFarm(globalFarmId)
        ).unwrap();
        const yieldFarm = (
          await this.api.query.xykWarehouseLM.yieldFarm(
            assetId,
            globalFarmId,
            yieldFarmId
          )
        ).unwrap();

        const priceAdjustment =
          (await this.getOraclePrice(globalFarm)) ??
          globalFarm.priceAdjustment.toString();

        const accountResolver = this.getAccountResolver(this.api.registry);
        const potAddress = accountResolver(
          Number(globalFarmId),
          true
        ).toString();
        const rewardCurrency = globalFarm.rewardCurrency.toString();
        const balance = await this.balanceClient.getTokenBalanceData(
          potAddress,
          rewardCurrency
        );

        return {
          assetId,
          globalFarm,
          yieldFarm,
          priceAdjustment,
          potBalance: balance.free.toString(),
        };
      })
    );

    return farms;
  }

  async getOraclePrice(globalFarm: PalletLiquidityMiningGlobalFarmData) {
    const rewardCurrency = globalFarm.rewardCurrency.toString();
    const incentivizedAsset = globalFarm.incentivizedAsset.toString();

    const orderedAssets = [rewardCurrency, incentivizedAsset].sort() as [
      string,
      string,
    ];

    if (rewardCurrency === incentivizedAsset)
      return new BigNumber(1).shiftedBy(18).toString();

    const res = await this.api.query.emaOracle.oracles(
      'omnipool',
      orderedAssets,
      'TenMinutes'
    );

    if (res.isNone) return undefined;

    const [data] = res.unwrap();
    const n = data.price.n.toString();
    const d = data.price.d.toString();

    let oraclePrice;
    if (Number(rewardCurrency) < Number(incentivizedAsset)) {
      oraclePrice = fixed_from_rational(n, d);
    } else {
      oraclePrice = fixed_from_rational(d, n);
    }

    return oraclePrice;
  }

  private getGlobalRewardPerPeriod(
    totalSharesZ: BigNumber,
    yieldPerPeriod: BigNumber,
    maxRewardPerPeriod: BigNumber,
    priceAdjustemnt: string
  ) {
    const globalRewardPerPeriod_ = totalSharesZ
      .times(yieldPerPeriod)
      .shiftedBy(-18);

    const globalRewardPerPeriod = globalRewardPerPeriod_
      .times(priceAdjustemnt)
      .shiftedBy(-18);

    const isFarmFull = globalRewardPerPeriod.gte(maxRewardPerPeriod);

    return isFarmFull ? maxRewardPerPeriod : globalRewardPerPeriod;
  }

  private getPoolYieldPerPeriod(
    globalRewardPerPeriod: BigNumber,
    multiplier: BigNumber,
    totalSharesZ: BigNumber,
    priceAdjustemnt: string
  ) {
    return globalRewardPerPeriod
      .times(multiplier)
      .div(totalSharesZ.times(priceAdjustemnt).shiftedBy(-18));
  }

  private padEndU8a(value: U8aLike, length: number) {
    return u8aConcat(value, Array(Math.max(0, length - value.length)).fill(0));
  }

  private getAccountResolver =
    (registry: Registry) =>
    (sub: u32 | number, isXyk?: boolean): AccountId32 => {
      // TYPE_ID based on Substrate
      const TYPE_ID = 'modl';
      const PALLET_ID = isXyk ? '0x78796b4c4d704944' : '0x4f6d6e6957684c4d';

      return new GenericAccountId32(
        registry,
        this.padEndU8a(
          u8aConcat(
            TYPE_ID,
            PALLET_ID,
            typeof sub !== 'number' ? sub.toU8a() : [sub]
          ),
          32
        )
      );
    };

  /**
   * Return list of all available assets from substrate based pools
   * @param {string} id - asset id within omnipool or address of isolated pool
   * @param {'omnipool' | 'isolatedpool'} type - type of pool
   * @returns {string} sum of all active farm APRS
   */
  async getFarmApr(id: string, type: 'omnipool' | 'isolatedpool') {
    if (type === 'isolatedpool' && !isAddress(id))
      throw new Error('You must pass an address of isolated pool as id');

    if (type === 'omnipool' && isAddress(id))
      throw new Error('You must pass an asset id of omnipool');

    const blockTime = 6;

    const farms =
      type === 'omnipool'
        ? await this.getOmnipoolFarms(id)
        : await this.getIsolatedPoolFarms(id);

    if (!farms.length) return undefined;

    const aprs = farms.map(
      ({ yieldFarm, globalFarm, priceAdjustment, potBalance }) => {
        const totalSharesZ = new BigNumber(globalFarm.totalSharesZ.toString());
        const plannedYieldingPeriods =
          globalFarm.plannedYieldingPeriods.toString();
        const yieldPerPeriod = new BigNumber(
          globalFarm.yieldPerPeriod.toString()
        );
        const maxRewardPerPeriod = new BigNumber(
          globalFarm.maxRewardPerPeriod.toString()
        );
        const blocksPerPeriod = globalFarm.blocksPerPeriod.toString();

        const multiplier = new BigNumber(
          yieldFarm.multiplier.toString()
        ).shiftedBy(-18);

        const periodsPerYear = this.secondsInYear.div(
          new BigNumber(blockTime).times(blocksPerPeriod)
        );

        let apr;

        if (totalSharesZ.isZero()) {
          apr = yieldPerPeriod.times(multiplier).times(periodsPerYear);
        } else {
          const globalRewardPerPeriod = this.getGlobalRewardPerPeriod(
            totalSharesZ,
            yieldPerPeriod,
            maxRewardPerPeriod,
            priceAdjustment
          );
          const poolYieldPerPeriod = this.getPoolYieldPerPeriod(
            globalRewardPerPeriod,
            multiplier,
            totalSharesZ,
            priceAdjustment
          );

          apr = poolYieldPerPeriod.times(periodsPerYear);
        }

        const distributedRewards = new BigNumber(
          globalFarm.pendingRewards.toString()
        ).plus(globalFarm.accumulatedPaidRewards.toString());
        const maxRewards = maxRewardPerPeriod.times(plannedYieldingPeriods);

        const potMaxRewards = potBalance
          ? distributedRewards.plus(potBalance)
          : maxRewards;

        const isDistributed = distributedRewards.div(potMaxRewards).gte(0.999);

        return isDistributed
          ? ZERO
          : apr.div(type === 'isolatedpool' ? 2 : 1).times(100);
      }
    );

    const aprSum = aprs.reduce((acc, apr) => acc.plus(apr), ZERO).toString();

    return aprSum;
  }
}
