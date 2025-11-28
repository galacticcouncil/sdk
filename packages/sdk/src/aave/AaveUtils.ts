import { AaveClient } from './AaveClient';
import { AaveSummary, AaveReserveData } from './types';

import { H160 } from '../utils/h160';
import { ERC20 } from '../utils/erc20';
import { bnum, BigNumber, ZERO, scale } from '../utils/bignumber';

import { EvmClient } from '../evm';
import { Amount } from '../types';

const RAY = bnum('1e27');
const TARGET_WITHDRAW_HF = bnum('1.01');
const SECONDS_PER_YEAR = bnum('31536000');
const LTV_PRECISION = 4;
const INVALID_HF = -1;

export class AaveUtils {
  readonly client: AaveClient;

  constructor(evm: EvmClient) {
    this.client = new AaveClient(evm);
  }

  async getSummary(user: string): Promise<AaveSummary> {
    const to = H160.fromAny(user);

    const [poolReserves, userReserves, userData, blockTimestamp] =
      await Promise.all([
        this.client.getReservesData(),
        this.client.getUserReservesData(to),
        this.client.getUserAccountData(to),
        this.client.getBlockTimestamp(),
      ]);

    const [pReserves] = poolReserves;
    const [uReserves, userEmodeCategoryId] = userReserves;
    const [
      totalCollateralBase,
      totalDebtBase,
      _availableBorrowsBase,
      currentLiquidationThreshold,
      _ltv,
      healthFactor,
    ] = userData;

    const hf = bnum(healthFactor)
      .dividedBy(1e18)
      .decimalPlaces(6, BigNumber.ROUND_DOWN);

    const totalCollateral = bnum(totalCollateralBase);
    const totalDebt = bnum(totalDebtBase);

    const reserves: AaveReserveData[] = [];

    for (const uReserve of uReserves) {
      const reserveAsset = uReserve.underlyingAsset.toLowerCase();

      const pReserve = pReserves.find(
        ({ underlyingAsset }) => underlyingAsset.toLowerCase() === reserveAsset
      );

      if (!pReserve)
        throw new Error('Missing pool reserve for ' + reserveAsset);

      const scaledABalance = bnum(uReserve.scaledATokenBalance);
      const liquidityIndex = bnum(pReserve.liquidityIndex);
      const liquidityRate = bnum(pReserve.liquidityRate);
      const availableLiquidity = bnum(pReserve.availableLiquidity);

      const priceInRef = bnum(pReserve.priceInMarketReferenceCurrency);

      const nextBlockTimestamp = blockTimestamp + 6; // adding 6 sec (blocktime)
      const linearInterest = this.calculateLinearInterest(
        liquidityRate,
        pReserve.lastUpdateTimestamp,
        nextBlockTimestamp
      );

      const currLiquidityIndex = liquidityIndex
        .multipliedBy(linearInterest)
        .dividedBy(RAY)
        .decimalPlaces(0, BigNumber.ROUND_DOWN);

      const aTokenBalance = scaledABalance
        .multipliedBy(currLiquidityIndex)
        .dividedBy(RAY)
        .decimalPlaces(0, BigNumber.ROUND_DOWN);

      const userIsInEmode = userEmodeCategoryId !== 0;

      const reserveLiquidationThreshold = bnum(
        userIsInEmode && userEmodeCategoryId === pReserve.eModeCategoryId
          ? pReserve.eModeLiquidationThreshold
          : pReserve.reserveLiquidationThreshold
      ).div(10000);

      const isCollateral =
        pReserve.usageAsCollateralEnabled &&
        uReserve.usageAsCollateralEnabledOnUser &&
        bnum(uReserve.scaledATokenBalance).gt(0);

      const reserveId = ERC20.toAssetId(reserveAsset);

      reserves.push({
        aTokenBalance,
        availableLiquidity,
        decimals: Number(pReserve.decimals),
        isCollateral,
        priceInRef,
        reserveId,
        reserveAsset,
        reserveLiquidationThreshold,
      });
    }

    return {
      healthFactor: hf.toNumber(),
      currentLiquidationThreshold: bnum(currentLiquidationThreshold)
        .dividedBy(10 ** LTV_PRECISION)
        .toNumber(),
      totalCollateral: totalCollateral,
      totalDebt: totalDebt,
      reserves: reserves,
    };
  }

  /**
   * Check if user has active borrow positions
   *
   * @param user - user address
   * @returns true if user has debt, otherwise false
   */
  async hasBorrowPositions(user: string): Promise<boolean> {
    const to = H160.fromAny(user);
    const userData = await this.client.getUserAccountData(to);
    const [_totalCollateralBase, totalDebtBase] = userData;
    return totalDebtBase > 0n;
  }

  /**
   * Get current user health factor
   *
   * @param user - user address
   * @returns health factor decimal value
   */
  async getHealthFactor(user: string): Promise<number> {
    const to = H160.fromAny(user);
    const userData = await this.client.getUserAccountData(to);
    const [
      totalCollateralBase,
      totalDebtBase,
      _availableBorrowsBase,
      currentLiquidationThreshold,
      _ltv,
      _healthFactor,
    ] = userData;

    return this.calculateHealthFactorFromBalances(
      bnum(totalDebtBase),
      bnum(totalCollateralBase),
      bnum(currentLiquidationThreshold)
    );
  }

  /**
   * Estimate health factor after aToken withdraw
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry)
   * @param withdrawAmount - aToken withdrawAmount amount (decimal)
   * @returns health factor decimal value
   */
  async getHealthFactorAfterWithdraw(
    user: string,
    reserve: string,
    withdrawAmount: string
  ): Promise<number> {
    const {
      totalCollateral,
      totalDebt,
      reserves,
      currentLiquidationThreshold,
    } = await this.getSummary(user);

    if (totalDebt.lte(0)) return INVALID_HF;

    const reserveAsset = ERC20.fromAssetId(reserve);
    const reserveCtx = reserves.find((r) => r.reserveAsset === reserveAsset);

    if (!reserveCtx) throw new Error('Missing reserve ctx for ' + reserveAsset);

    const { decimals, isCollateral, priceInRef, reserveLiquidationThreshold } =
      reserveCtx;

    const withdrawAmountNative = scale(
      bnum(withdrawAmount),
      decimals
    ).decimalPlaces(0, BigNumber.ROUND_DOWN);

    // Convert withdraw amount to reference currency units
    const withdrawRef = isCollateral
      ? withdrawAmountNative
          .multipliedBy(priceInRef)
          .dividedBy(bnum(10).pow(decimals))
          .decimalPlaces(0, BigNumber.ROUND_DOWN)
      : ZERO;

    const adjustedCollateral = totalCollateral.minus(withdrawRef);

    // HF = 0 if no collateral
    if (adjustedCollateral.lte(0)) return 0;

    const weightedLT = totalCollateral
      .multipliedBy(bnum(currentLiquidationThreshold))
      .minus(withdrawRef.multipliedBy(reserveLiquidationThreshold))
      .dividedBy(adjustedCollateral);

    // HF = (C * LT) / B
    const healthFactor = adjustedCollateral
      .multipliedBy(weightedLT)
      .dividedBy(totalDebt)
      .decimalPlaces(6, BigNumber.ROUND_DOWN);

    return healthFactor.toNumber();
  }

  /**
   * Estimate health factor after reserve supply
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry)
   * @param supplyAmount - reserve supply amount (decimal)
   * @returns health factor decimal value
   */
  async getHealthFactorAfterSupply(
    user: string,
    reserve: string,
    supplyAmount: string
  ): Promise<number> {
    const {
      totalCollateral,
      totalDebt,
      reserves,
      currentLiquidationThreshold,
    } = await this.getSummary(user);

    if (totalDebt.lte(0)) return INVALID_HF;

    const reserveAsset = ERC20.fromAssetId(reserve);
    const reserveCtx = reserves.find((r) => r.reserveAsset === reserveAsset);

    if (!reserveCtx) throw new Error('Missing reserve ctx for ' + reserveAsset);

    const { decimals, priceInRef, reserveLiquidationThreshold } = reserveCtx;

    const supplyAmountNative = scale(
      bnum(supplyAmount),
      decimals
    ).decimalPlaces(0, BigNumber.ROUND_DOWN);

    // Convert supply amount to reference currency units
    const supplyRef = supplyAmountNative
      .multipliedBy(priceInRef)
      .dividedBy(bnum(10).pow(decimals))
      .decimalPlaces(0, BigNumber.ROUND_DOWN);

    const newCollateral = totalCollateral.plus(supplyRef);

    // Avoid division by zero, HF = 0
    if (newCollateral.lte(0)) return 0;

    const weightedLT = totalCollateral
      .multipliedBy(bnum(currentLiquidationThreshold))
      .plus(supplyRef.multipliedBy(reserveLiquidationThreshold))
      .dividedBy(newCollateral);

    // HF = (C * LT) / B
    const healthFactor = newCollateral
      .multipliedBy(weightedLT)
      .dividedBy(totalDebt)
      .decimalPlaces(6, BigNumber.ROUND_DOWN);

    return healthFactor.toNumber();
  }

  /**
   * Estimate health factor after swapping between reserves
   *
   * @param user - user address
   * @param fromAmount - amount to withdraw (decimal)
   * @param fromReserve - reserve on-chain id (registry) to withdraw from
   * @param toAmount - amount to supply (decimal)
   * @param toReserve - reserve on-chain id (registry) to supply to
   * @returns health factor decimal value after swap
   */
  async getHealthFactorAfterSwap(
    user: string,
    fromAmount: string,
    fromReserve: string,
    toAmount: string,
    toReserve: string
  ): Promise<number> {
    const { totalDebt, reserves, healthFactor } = await this.getSummary(user);

    if (totalDebt.lte(0)) return INVALID_HF;

    const fromReserveAsset = ERC20.fromAssetId(fromReserve);
    const toReserveAsset = ERC20.fromAssetId(toReserve);

    const fromReserveCtx = reserves.find(
      (r) => r.reserveAsset === fromReserveAsset
    );

    const toReserveCtx = reserves.find(
      (r) => r.reserveAsset === toReserveAsset
    );

    if (!fromReserveCtx)
      throw new Error(`Missing reserve ctx for ${fromReserveAsset}`);

    if (!toReserveCtx) {
      throw new Error(`Missing reserve ctx for ${toReserveAsset}`);
    }

    const fromAmountNative = scale(
      bnum(fromAmount),
      fromReserveCtx.decimals
    ).decimalPlaces(0, BigNumber.ROUND_DOWN);

    const toAmountNative = scale(
      bnum(toAmount),
      toReserveCtx.decimals
    ).decimalPlaces(0, BigNumber.ROUND_DOWN);

    const fromValueInRef = fromAmountNative
      .multipliedBy(fromReserveCtx.priceInRef)
      .dividedBy(bnum(10).pow(fromReserveCtx.decimals))
      .decimalPlaces(0, BigNumber.ROUND_DOWN);

    const toValueInRef = toAmountNative
      .multipliedBy(toReserveCtx.priceInRef)
      .dividedBy(bnum(10).pow(toReserveCtx.decimals))
      .decimalPlaces(0, BigNumber.ROUND_DOWN);

    const fromWeightedCollateral = fromReserveCtx.isCollateral
      ? fromValueInRef.multipliedBy(fromReserveCtx.reserveLiquidationThreshold)
      : ZERO;

    const toWeightedCollateral = toValueInRef.multipliedBy(
      toReserveCtx.reserveLiquidationThreshold
    );

    const weightedCollateralDelta = toWeightedCollateral.minus(
      fromWeightedCollateral
    );
    const hfDelta = weightedCollateralDelta.dividedBy(totalDebt);
    const hfAfterSwap = bnum(healthFactor)
      .plus(hfDelta)
      .decimalPlaces(6, BigNumber.ROUND_DOWN);

    return hfAfterSwap.toNumber();
  }

  /**
   * Get MAX withdraw balance for given user reserve
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry)
   * @returns aToken max withdrawable balance
   */
  async getMaxWithdraw(user: string, reserveId: string): Promise<Amount> {
    const { totalDebt, reserves, healthFactor } = await this.getSummary(user);

    const reserveAsset = ERC20.fromAssetId(reserveId);
    const reserve = reserves.find((r) => r.reserveAsset === reserveAsset);

    if (!reserve) throw new Error('Missing reserve data for ' + reserveAsset);

    return this.calculateWithdrawMax(reserve, totalDebt, healthFactor);
  }

  /**
   * Get MAX withdraw balances for all user reserves
   *
   * @param user - user address
   * @returns aTokens max withdrawable balances
   */
  async getMaxWithdrawAll(user: string): Promise<Record<number, Amount>> {
    const { totalDebt, reserves, healthFactor } = await this.getSummary(user);

    const result: Record<number, Amount> = {};

    for (const reserve of reserves) {
      const amount = this.calculateWithdrawMax(
        reserve,
        totalDebt,
        healthFactor
      );

      if (reserve.reserveId) {
        result[reserve.reserveId] = amount;
      }
    }
    return result;
  }

  /**
   * Calculate maxWithdraw using following formula:
   *
   * maxWithdraw = (HF - 1.01 x totalDebt) / reserveLT
   */
  private calculateWithdrawMax(
    reserve: AaveReserveData,
    totalDebt: BigNumber,
    currentHF: number
  ): Amount {
    const {
      aTokenBalance,
      availableLiquidity,
      decimals,
      priceInRef,
      reserveLiquidationThreshold,
      isCollateral,
    } = reserve;

    let maxWithdrawableTokens = aTokenBalance;

    // If the asset is used as collateral and user has debt, compute HF-limited max
    if (isCollateral && totalDebt.gt(0)) {
      const excessHF = bnum(currentHF).minus(TARGET_WITHDRAW_HF);

      if (excessHF.gt(0)) {
        const maxCollateralToWithdrawInRef = excessHF
          .multipliedBy(totalDebt)
          .dividedBy(reserveLiquidationThreshold)
          .decimalPlaces(0, BigNumber.ROUND_DOWN);

        const hfCapped = maxCollateralToWithdrawInRef
          .dividedBy(priceInRef)
          .multipliedBy(bnum(10).pow(decimals))
          .decimalPlaces(0, BigNumber.ROUND_DOWN);

        maxWithdrawableTokens = BigNumber.minimum(aTokenBalance, hfCapped);
      } else {
        maxWithdrawableTokens = ZERO;
      }
    }

    // Apply pool liquidity cap
    const maxOrCap = BigNumber.minimum(
      maxWithdrawableTokens,
      availableLiquidity
    );

    return {
      amount: maxOrCap,
      decimals,
    };
  }

  private calculateLinearInterest(
    liquidityRate: BigNumber,
    lastUpdateTimestamp: number,
    currentTimestamp: number
  ): BigNumber {
    const delta = currentTimestamp - lastUpdateTimestamp;
    if (delta <= 0) return RAY;

    const linearAccumulation = liquidityRate
      .multipliedBy(delta)
      .dividedBy(SECONDS_PER_YEAR)
      .plus(RAY)
      .decimalPlaces(0, BigNumber.ROUND_DOWN);

    return linearAccumulation;
  }

  /**
   * Original AAVE health factor calculation formula:
   * @see https://github.com/aave/aave-utilities/blob/432e283b2e76d9793b20d37bd4cb94aca97ed20e/packages/math-utils/src/pool-math.ts#L139
   */
  private calculateHealthFactorFromBalances(
    totalDebt: BigNumber,
    totalCollateral: BigNumber,
    currentLiquidationThreshold: BigNumber
  ): number {
    if (totalDebt.lte(0)) {
      return INVALID_HF;
    }

    const hfFromBalances = totalCollateral
      .multipliedBy(currentLiquidationThreshold)
      .dividedBy(totalDebt);

    const hf = hfFromBalances
      .dividedBy(bnum(10).pow(LTV_PRECISION))
      .decimalPlaces(6, BigNumber.ROUND_DOWN);

    return hf.toNumber();
  }
}
