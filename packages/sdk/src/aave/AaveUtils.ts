import { AaveClient } from './AaveClient';
import { AaveSummary, AaveReserveData } from './types';

import { H160 } from '../utils/h160';
import { ERC20 } from '../utils/erc20';
import { bnum, BigNumber, ZERO, scale } from '../utils/bignumber';

import { EvmClient } from '../evm';
import { Amount } from '../types';

const RAY = bnum('1e27');
const TARGET_WITHDRAW_HF = bnum('1.01');

export class AaveUtils {
  private client: AaveClient;

  constructor(evmClient?: EvmClient) {
    const evm = evmClient ?? new EvmClient();
    this.client = new AaveClient(evm);
  }

  async getSummary(user: string): Promise<AaveSummary> {
    const to = H160.fromAny(user);

    const [poolReserves, userReserves, userData] = await Promise.all([
      this.client.getReservesData(),
      this.client.getUserReservesData(to),
      this.client.getUserAccountData(to),
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
      const priceInRef = bnum(pReserve.priceInMarketReferenceCurrency);

      const aTokenBalance = scaledABalance
        .multipliedBy(liquidityIndex)
        .dividedBy(RAY)
        .decimalPlaces(0, BigNumber.ROUND_DOWN);

      const reserveLiquidationThreshold = bnum(
        userEmodeCategoryId === pReserve.eModeCategoryId
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
      _totalCollateralBase,
      _totalDebtBase,
      _availableBorrowsBase,
      _currentLiquidationThreshold,
      _ltv,
      healthFactor,
    ] = userData;

    const hf = bnum(healthFactor)
      .dividedBy(1e18)
      .decimalPlaces(6, BigNumber.ROUND_DOWN);

    return hf.toNumber();
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
    reserve: string,
    withdrawAmount: string
  ): Promise<number> {
    const { totalCollateral, totalDebt, reserves } =
      await this.getSummary(user);

    const reserveAsset = ERC20.fromAssetId(reserve);
    const reserveCtx = reserves.find((r) => r.reserveAsset === reserveAsset);

    if (!reserveCtx) throw new Error('Missing reserve ctx for ' + reserveAsset);

    const { decimals, isCollateral, priceInRef, reserveLiquidationThreshold } =
      reserveCtx;

    const withdrawAmountNative = scale(
      bnum(withdrawAmount),
      decimals
    ).decimalPlaces(0, 1);

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

    // HF = (C * LT) / D
    const healthFactor = adjustedCollateral
      .multipliedBy(reserveLiquidationThreshold)
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
    const { totalCollateral, totalDebt, reserves } =
      await this.getSummary(user);

    const reserveAsset = ERC20.fromAssetId(reserve);
    const reserveCtx = reserves.find((r) => r.reserveAsset === reserveAsset);

    if (!reserveCtx) throw new Error('Missing reserve ctx for ' + reserveAsset);

    const { decimals, priceInRef, reserveLiquidationThreshold } = reserveCtx;

    const supplyAmountNative = scale(
      bnum(supplyAmount),
      decimals
    ).decimalPlaces(0, 1);

    // Convert supply amount to reference currency units
    const supplyRef = supplyAmountNative
      .multipliedBy(priceInRef)
      .dividedBy(bnum(10).pow(decimals))
      .decimalPlaces(0, BigNumber.ROUND_DOWN);

    const newCollateral = totalCollateral.plus(supplyRef);

    // Avoid division by zero
    if (newCollateral.lte(0)) return 0;

    // HF = (C * LT) / B
    const healthFactor = newCollateral
      .multipliedBy(reserveLiquidationThreshold)
      .dividedBy(totalDebt)
      .decimalPlaces(6, BigNumber.ROUND_DOWN);

    return healthFactor.toNumber();
  }

  /**
   * Get MAX withdraw balance for given user reserve
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry)
   * @returns aToken max withdrawable balance
   */
  async getMaxWithdraw(user: string, reserve: string): Promise<Amount> {
    const { totalCollateral, totalDebt, reserves } =
      await this.getSummary(user);

    const reserveAsset = ERC20.fromAssetId(reserve);
    const reserveCtx = reserves.find((r) => r.reserveAsset === reserveAsset);

    if (!reserveCtx) throw new Error('Missing reserve ctx for ' + reserveAsset);

    return this.calculateWithdrawMax(reserveCtx, totalCollateral, totalDebt);
  }

  /**
   * Get MAX withdraw balances for all user reserves
   *
   * @param user - user address
   * @returns aTokens max withdrawable balances
   */
  async getMaxWithdrawAll(user: string): Promise<Record<number, Amount>> {
    const { totalCollateral, totalDebt, reserves } =
      await this.getSummary(user);

    const result: Record<number, Amount> = {};

    for (const reserve of reserves) {
      const amount = this.calculateWithdrawMax(
        reserve,
        totalCollateral,
        totalDebt
      );

      if (reserve.reserveId) {
        result[reserve.reserveId] = amount;
      }
    }
    return result;
  }

  private calculateWithdrawMax(
    reserve: AaveReserveData,
    totalCollateral: BigNumber,
    totalDebt: BigNumber
  ) {
    const { aTokenBalance, decimals, priceInRef, reserveLiquidationThreshold } =
      reserve;

    const requiredCollateral = TARGET_WITHDRAW_HF.multipliedBy(totalDebt)
      .div(reserveLiquidationThreshold)
      .decimalPlaces(0, BigNumber.ROUND_UP);

    const withdrawableRef = totalCollateral
      .minus(requiredCollateral)
      .decimalPlaces(0, 1);

    if (withdrawableRef.lte(0)) {
      return {
        amount: ZERO,
        decimals: decimals,
      };
    }

    const withdrawableTokens = withdrawableRef
      .multipliedBy(bnum(10).pow(decimals)) // apply token decimals
      .dividedBy(priceInRef) // divide by ref price decimals
      .decimalPlaces(0, BigNumber.ROUND_DOWN);

    const maxWithdrawable = BigNumber.minimum(
      aTokenBalance,
      withdrawableTokens
    );

    return {
      amount: maxWithdrawable,
      decimals,
    } as Amount;
  }
}
