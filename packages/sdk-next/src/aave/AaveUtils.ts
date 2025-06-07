import { AaveClient } from './AaveClient';
import { AaveSummary, AaveReserveData } from './types';

import { big, erc20, h160 } from '../utils';

import { EvmClient } from '../evm';
import { Amount } from '../types';

const { ERC20 } = erc20;
const { H160 } = h160;

const TARGET_WITHDRAW_HF = 1.01;
const SAFE_MAX_HEALTH_FACTOR = 99999;

const RAY = 10n ** 27n;
const WAD = 10n ** 18n;

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
      const priceInRef = pReserve.priceInMarketReferenceCurrency;

      const aTokenBalance = (scaledABalance * liquidityIndex) / RAY;

      const rawThreshold = Number(
        userEmodeCategoryId === pReserve.eModeCategoryId
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
      _totalCollateralBase,
      _totalDebtBase,
      _availableBorrowsBase,
      _currentLiquidationThreshold,
      _ltv,
      healthFactor,
    ] = userData;

    const hf = big.toDecimal(healthFactor, 18);
    return Number(hf);
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

    // HF = (C * LT) / D
    return this.calculateHealthFactor(
      adjustedCollateral,
      reserveLiquidationThreshold,
      totalDebt
    );
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

    // Avoid division by zero
    if (newCollateral <= 0n) return 0;

    // HF = (C * LT) / B
    return this.calculateHealthFactor(
      newCollateral,
      reserveLiquidationThreshold,
      totalDebt
    );
  }

  /**
   * Get MAX withdraw balance for given user reserve
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry)
   * @returns aToken max withdrawable balance
   */
  async getMaxWithdraw(user: string, reserve: number): Promise<Amount> {
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

  private calculateHealthFactor(
    adjustedCollateral: bigint,
    reserveLiquidationThreshold: number | string,
    totalDebt: bigint
  ): number {
    if (totalDebt === 0n) {
      return SAFE_MAX_HEALTH_FACTOR;
    }

    const SCALE = 10n ** 6n; // 6 decimal places
    const thresholdScaled = big.toBigInt(reserveLiquidationThreshold, 18);

    const numerator = adjustedCollateral * thresholdScaled * SCALE;
    const denominator = totalDebt * WAD;

    const result = numerator / denominator;
    return Number(result) / 1e6;
  }

  private calculateRequiredCollateral(
    targetHF: number | string,
    reserveLiquidationThreshold: number | string,
    totalDebt: bigint
  ): bigint {
    const targetHFScaled = big.toBigInt(targetHF, 18);
    const thresholdScaled = big.toBigInt(reserveLiquidationThreshold, 18);

    const numerator = targetHFScaled * totalDebt;
    return (numerator + thresholdScaled - 1n) / thresholdScaled;
  }

  private calculateWithdrawMax(
    reserve: AaveReserveData,
    totalCollateral: bigint,
    totalDebt: bigint
  ) {
    const { aTokenBalance, decimals, priceInRef, reserveLiquidationThreshold } =
      reserve;

    const requiredCollateral = this.calculateRequiredCollateral(
      TARGET_WITHDRAW_HF,
      reserveLiquidationThreshold,
      totalDebt
    );

    const withdrawableRef = totalCollateral - requiredCollateral;

    if (withdrawableRef <= 0n) {
      return {
        amount: 0n,
        decimals: decimals,
      };
    }

    const withdrawableTokens =
      (withdrawableRef * 10n ** BigInt(decimals)) / priceInRef;

    const maxWithdrawable =
      aTokenBalance < withdrawableTokens ? aTokenBalance : withdrawableTokens;

    return {
      amount: maxWithdrawable,
      decimals,
    } as Amount;
  }
}
