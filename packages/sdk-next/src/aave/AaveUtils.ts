import Big from 'big.js';

import { big, erc20, h160 } from '@galacticcouncil/common';

import { AaveClient } from './AaveClient';
import { AaveSummary, AaveReserveData } from './types';

import { EvmClient } from '../evm';
import { Amount } from '../types';

const { ERC20 } = erc20;
const { H160 } = h160;

const TARGET_WITHDRAW_HF = 1.01;
const SECONDS_PER_YEAR = 31536000n;
const LTV_PRECISION = 4;
const INVALID_HF = -1;

const RAY = 10n ** 27n;

export class AaveUtils {
  private client: AaveClient;

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
      _currentLiquidationThreshold,
      _ltv,
      healthFactor,
    ] = userData;

    const hf = big.toDecimal(healthFactor, 18);

    const reserves: AaveReserveData[] = [];

    for (const uReserve of uReserves) {
      const reserveAsset = uReserve.underlyingAsset.toLowerCase();

      const pReserve = pReserves.find(
        ({ underlyingAsset }) => underlyingAsset.toLowerCase() === reserveAsset
      );

      if (!pReserve)
        throw new Error('Missing pool reserve for ' + reserveAsset);

      const scaledABalance = uReserve.scaledATokenBalance;
      const liquidityIndex = pReserve.liquidityIndex;
      const liquidityRate = pReserve.liquidityRate;
      const availableLiquidity = pReserve.availableLiquidity;

      const priceInRef = pReserve.priceInMarketReferenceCurrency;

      const nextBlockTimestamp = blockTimestamp + 6; // adding 6 sec (blocktime)
      const linearInterest = this.calculateLinearInterest(
        liquidityRate,
        pReserve.lastUpdateTimestamp,
        nextBlockTimestamp
      );

      const currLiquidityIndex = (liquidityIndex * linearInterest) / RAY;
      const aTokenBalance = (scaledABalance * currLiquidityIndex) / RAY;

      const userIsInEmode = userEmodeCategoryId !== 0;

      const rawThreshold = Number(
        userIsInEmode && userEmodeCategoryId === pReserve.eModeCategoryId
          ? pReserve.eModeLiquidationThreshold
          : pReserve.reserveLiquidationThreshold
      );

      const reserveLiquidationThreshold = rawThreshold / 10000;

      const isCollateral =
        pReserve.usageAsCollateralEnabled &&
        uReserve.usageAsCollateralEnabledOnUser &&
        uReserve.scaledATokenBalance > 0n;

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
      healthFactor: Number(hf),
      totalCollateral: totalCollateralBase,
      totalDebt: totalDebtBase,
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
      totalDebtBase,
      totalCollateralBase,
      currentLiquidationThreshold
    );
  }

  /**
   * Estimate health factor after aToken withdraw
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry)
   * @param supplyAmount - aToken withdrawAmount amount (decimal)
   * @returns health factor decimal value
   */
  async getHealthFactorAfterWithdraw(
    user: string,
    reserve: number,
    withdrawAmount: string
  ): Promise<number> {
    const { totalCollateral, totalDebt, reserves } =
      await this.getSummary(user);

    const reserveAsset = ERC20.fromAssetId(reserve);
    const reserveCtx = reserves.find((r) => r.reserveAsset === reserveAsset);

    if (!reserveCtx) throw new Error('Missing reserve ctx for ' + reserveAsset);

    const { decimals, isCollateral, priceInRef, reserveLiquidationThreshold } =
      reserveCtx;

    const withdrawAmountNative = big.toBigInt(withdrawAmount, decimals);

    // Convert withdraw amount to reference currency units
    const withdrawRef = isCollateral
      ? (withdrawAmountNative * priceInRef) / 10n ** BigInt(decimals)
      : 0n;

    const adjustedCollateral = totalCollateral - withdrawRef;

    // HF = 0 if no collateral
    if (adjustedCollateral <= 0n) return 0;

    // HF = (C * LT) / B
    const healthFactor = Big(adjustedCollateral.toString())
      .mul(reserveLiquidationThreshold)
      .div(totalDebt.toString())
      .toFixed(6, Big.roundDown);

    return Number(healthFactor);
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
    reserve: number,
    supplyAmount: string
  ): Promise<number> {
    const { totalCollateral, totalDebt, reserves } =
      await this.getSummary(user);

    const reserveAsset = ERC20.fromAssetId(reserve);
    const reserveCtx = reserves.find((r) => r.reserveAsset === reserveAsset);

    if (!reserveCtx) throw new Error('Missing reserve ctx for ' + reserveAsset);

    const { decimals, priceInRef, reserveLiquidationThreshold } = reserveCtx;

    const supplyAmountNative = big.toBigInt(supplyAmount, decimals);

    // Convert supply amount to reference currency units
    const supplyRef =
      (supplyAmountNative * priceInRef) / 10n ** BigInt(decimals);

    const newCollateral = totalCollateral + supplyRef;

    // Avoid division by zero, HF = 0
    if (newCollateral <= 0n) return 0;

    // HF = (C * LT) / B
    const healthFactor = Big(newCollateral.toString())
      .mul(reserveLiquidationThreshold)
      .div(totalDebt.toString())
      .toFixed(6, Big.roundDown);

    return Number(healthFactor);
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
    fromReserve: number,
    toAmount: string,
    toReserve: number
  ): Promise<number> {
    const { totalDebt, reserves, healthFactor } = await this.getSummary(user);

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
      throw new Error(`Missing reserve ctx for ${toReserveCtx}`);
    }

    const fromAmountNative = big.toBigInt(fromAmount, fromReserveCtx.decimals);
    const toAmountNative = big.toBigInt(toAmount, toReserveCtx.decimals);

    const fromValueInRef =
      (fromAmountNative * fromReserveCtx.priceInRef) /
      10n ** BigInt(fromReserveCtx.decimals);

    const toValueInRef =
      (toAmountNative * toReserveCtx.priceInRef) /
      10n ** BigInt(toReserveCtx.decimals);

    const fromWeightedCollateral = fromReserveCtx.isCollateral
      ? Big(fromValueInRef.toString()).mul(
          fromReserveCtx.reserveLiquidationThreshold
        )
      : Big(0);

    const toWeightedCollateral = Big(toValueInRef.toString()).mul(
      toReserveCtx.reserveLiquidationThreshold
    );

    const weightedCollateralDelta = toWeightedCollateral.minus(
      fromWeightedCollateral
    );
    const hfDelta = weightedCollateralDelta.div(totalDebt.toString());
    const hfAfterSwap = Big(healthFactor)
      .plus(hfDelta)
      .toFixed(6, Big.roundDown);

    return Number(hfAfterSwap);
  }

  /**
   * Get MAX withdraw balance for given user reserve
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry)
   * @returns aToken max withdrawable balance
   */
  async getMaxWithdraw(user: string, reserve: number): Promise<Amount> {
    const { totalDebt, reserves, healthFactor } = await this.getSummary(user);

    const reserveAsset = ERC20.fromAssetId(reserve);
    const reserveCtx = reserves.find((r) => r.reserveAsset === reserveAsset);

    if (!reserveCtx) throw new Error('Missing reserve ctx for ' + reserveAsset);

    return this.calculateWithdrawMax(reserveCtx, totalDebt, healthFactor);
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
    totalDebt: bigint,
    currentHF: number
  ) {
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
    if (isCollateral && totalDebt > 0n) {
      const excessHF = currentHF - TARGET_WITHDRAW_HF;

      if (excessHF > 0) {
        const maxCollateralToWithdrawInRef = Big(excessHF)
          .mul(totalDebt.toString())
          .div(reserveLiquidationThreshold)
          .toFixed(0, Big.roundDown);

        const hfCapped = Big(maxCollateralToWithdrawInRef)
          .div(priceInRef.toString())
          .mul(10 ** decimals)
          .toFixed(0, Big.roundDown);

        maxWithdrawableTokens =
          aTokenBalance < BigInt(hfCapped) ? aTokenBalance : BigInt(hfCapped);
      } else {
        maxWithdrawableTokens = 0n;
      }
    }

    const maxOrCap =
      maxWithdrawableTokens < availableLiquidity
        ? maxWithdrawableTokens
        : availableLiquidity;

    return {
      amount: maxOrCap,
      decimals,
    } as Amount;
  }

  private calculateLinearInterest(
    liquidityRate: bigint,
    lastUpdateTimestamp: number,
    currentTimestamp: number
  ): bigint {
    const delta = currentTimestamp - lastUpdateTimestamp;
    if (delta <= 0) return RAY;

    const interest = (liquidityRate * BigInt(delta)) / SECONDS_PER_YEAR;
    return RAY + interest;
  }

  /**
   * Original AAVE health factor calculation formula:
   * @see https://github.com/aave/aave-utilities/blob/432e283b2e76d9793b20d37bd4cb94aca97ed20e/packages/math-utils/src/pool-math.ts#L139
   */
  private calculateHealthFactorFromBalances(
    totalDebt: bigint,
    totalCollateral: bigint,
    currentLiquidationThreshold: bigint
  ): number {
    if (totalDebt === 0n) {
      return INVALID_HF;
    }

    const hfFromBalances =
      (totalCollateral * currentLiquidationThreshold) / totalDebt;

    const hf = big.toDecimal(hfFromBalances, LTV_PRECISION);

    return Number(hf);
  }
}
