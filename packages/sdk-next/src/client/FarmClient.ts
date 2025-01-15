import { ApiPromise } from '@polkadot/api';
import { PalletLiquidityMiningGlobalFarmData } from '@polkadot/types/lookup';
import { isAddress } from '@polkadot/util-crypto';
import { fixed_from_rational } from '@galacticcouncil/math-liquidity-mining';
import { PolkadotApiClient } from './PolkadotApi';
import { BigNumber, ZERO } from '../utils/bignumber';

export class FarmClient extends PolkadotApiClient {
  constructor(api: ApiPromise) {
    super(api);
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

        return {
          assetId,
          globalFarm,
          yieldFarm,
          priceAdjustment,
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

        return {
          assetId,
          globalFarm,
          yieldFarm,
          priceAdjustment,
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

    const aprs = farms.map(({ yieldFarm, globalFarm, priceAdjustment }) => {
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

      const isDistributed = distributedRewards.div(maxRewards).gte(0.99);

      return isDistributed ? ZERO : apr.times(100);
    });

    const aprSum = aprs.reduce((acc, apr) => acc.plus(apr), ZERO).toString();

    return aprSum;
  }
}
