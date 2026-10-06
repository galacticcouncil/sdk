import { big, h160 } from '@galacticcouncil/common';

import { AaveClient } from './AaveClient';
import { AaveMarkets } from './AaveMarkets';
import {
  AaveBalanceDelta,
  INVALID_HF,
  LTV_PRECISION,
  accrueBalance,
  healthFactorFromBalances,
  isBorrowingAny,
  isUsingAsCollateral,
  maxWithdraw,
  projectHealthFactor,
} from './AaveMath';
import { AAVE_MAIN_MARKET, AAVE_MARKETS } from './const';
import { AaveMarket, AaveReserveData, AaveSummary } from './types';

import { Erc20Client } from '../client/Erc20Client';
import { BLOCK_TIME_TARGET } from '../consts';
import { EvmClient } from '../evm';
import { assetIdFromAddress } from '../pool/amm/assetAddress';
import { Amount } from '../types';

const { H160 } = h160;

const BLOCK_TIME_SEC = BLOCK_TIME_TARGET / 1000;

const lower = (a: string) => a.toLowerCase() as `0x${string}`;

/**
 * Aave money market reads.
 *
 * - `reserve` is the reserve on-chain id (registry); it picks the first
 *   market in `AAVE_MARKETS` listing it, so a shared reserve resolves to main
 * - An aToken id is not a reserve id: it matches no market and reads main
 * - Without a `reserve`, reads go to the main market
 * - Amounts are decimal strings, health factors plain numbers
 */
export class AaveUtils {
  private client: AaveClient;
  private markets: AaveMarkets;
  private erc20: Erc20Client;

  /**
   * @param evm - EVM client
   * @param erc20 - registry ERC20 index; one per instance when omitted
   */
  constructor(evm: EvmClient, erc20?: Erc20Client) {
    this.client = new AaveClient(evm);
    this.erc20 = erc20 ?? new Erc20Client(evm.client);
    this.markets = new AaveMarkets(this.client, this.erc20);
  }

  /**
   * Get user market summary
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry) picking the market
   * @returns market summary
   */
  async getSummary(user: string, reserve?: number): Promise<AaveSummary> {
    const market = await this.getMarket(reserve);
    return this.loadSummary(H160.fromAny(user), market);
  }

  /**
   * Check if user has active borrow positions
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry) picking the market
   * @returns true if user has debt, otherwise false
   */
  async hasBorrowPositions(user: string, reserve?: number): Promise<boolean> {
    const { pool } = await this.getMarket(reserve);
    const [, totalDebtBase] = await this.client.getUserAccountData(
      H160.fromAny(user),
      pool
    );
    return totalDebtBase > 0n;
  }

  /**
   * Get current user health factor
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry) picking the market
   * @returns health factor decimal value
   */
  async getHealthFactor(user: string, reserve?: number): Promise<number> {
    const { pool } = await this.getMarket(reserve);
    const [totalCollateralBase, totalDebtBase, , currentLiquidationThreshold] =
      await this.client.getUserAccountData(H160.fromAny(user), pool);

    return healthFactorFromBalances(
      totalDebtBase,
      totalCollateralBase,
      currentLiquidationThreshold
    );
  }

  /**
   * Estimate health factor after aToken withdraw
   *
   * - Also the health factor Aave checks when the aToken is swapped away:
   *   the router takes it first, and the swap output lands after the check
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry)
   * @param withdrawAmount - aToken withdrawAmount amount (decimal)
   * @returns health factor decimal value
   */
  async getHealthFactorAfterWithdraw(
    user: string,
    reserve: number,
    withdrawAmount: string
  ): Promise<number> {
    const summary = await this.getSummary(user, reserve);
    if (summary.totalDebt === 0n) return INVALID_HF;

    return projectHealthFactor(summary, [
      this.delta(summary, reserve, withdrawAmount, true),
    ]);
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
    const summary = await this.getSummary(user, reserve);
    if (summary.totalDebt === 0n) return INVALID_HF;

    return projectHealthFactor(summary, [
      this.delta(summary, reserve, supplyAmount, false),
    ]);
  }

  /**
   * Estimate health factor after swapping between reserves
   *
   * - Health factor of the `fromReserve` market once both legs settle
   * - A `toReserve` of another market leaves it unchanged
   * - Aave checks the health factor before the `toReserve` leg lands;
   *   `getHealthFactorAfterWithdraw` gives the one it checks
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
    const [market, toMarket] = await Promise.all([
      this.getMarket(fromReserve),
      this.getMarket(toReserve),
    ]);

    const summary = await this.loadSummary(H160.fromAny(user), market);
    if (summary.totalDebt === 0n) return INVALID_HF;

    const deltas = [this.delta(summary, fromReserve, fromAmount, true)];
    if (toMarket === market) {
      deltas.push(this.delta(summary, toReserve, toAmount, false));
    }
    return projectHealthFactor(summary, deltas);
  }

  /**
   * Get MAX withdraw balance for given user reserve
   *
   * - Keeps the health factor at 1.01, within available liquidity, and within
   *   the unlocked balance of a lockable aToken
   *
   * @param user - user address
   * @param reserve - reserve on-chain id (registry)
   * @returns aToken max withdrawable balance
   */
  async getMaxWithdraw(user: string, reserve: number): Promise<Amount> {
    const to = H160.fromAny(user);
    const market = await this.getMarket(reserve);
    const summary = await this.loadSummary(to, market);
    return this.withdrawMax(to, summary, this.findReserve(summary, reserve));
  }

  /**
   * Get MAX withdraw balances for all user reserves
   *
   * - Covers every market, read in parallel from one block timestamp
   * - A reserve listed in several markets keeps its main market entry
   *
   * @param user - user address
   * @returns aTokens max withdrawable balances
   */
  async getMaxWithdrawAll(user: string): Promise<Record<number, Amount>> {
    const to = H160.fromAny(user);
    const timestamp = await this.client.getBlockTimestamp();

    const summaries = await Promise.all(
      AAVE_MARKETS.map((market) => this.loadSummary(to, market, timestamp))
    );
    const rows = await Promise.all(
      summaries.flatMap((summary) =>
        summary.reserves.map(async (reserve) => ({
          reserveId: reserve.reserveId,
          amount: await this.withdrawMax(to, summary, reserve),
        }))
      )
    );

    const result: Record<number, Amount> = {};
    for (const { reserveId, amount } of rows) {
      if (reserveId !== null && !(reserveId in result)) {
        result[reserveId] = amount;
      }
    }
    return result;
  }

  /**
   * Whether trading an asset away runs Aave's health factor check, so the
   * transaction needs `AAVE_GAS_LIMIT` extra gas.
   *
   * - Aave checks only when the user borrows in that market and uses the
   *   aToken's reserve as collateral
   * - Only tradeable markets are read; an aToken of any other market
   *   resolves `false`
   * - A non-`Erc20` asset resolves without an EVM read
   * - The reserve index is read only when the user borrows in that market
   *
   * @param user - account moving the asset
   * @param asset - asset id leaving the account
   */
  async requiresExtraGas(user: string, asset: number): Promise<boolean> {
    const aToken = await this.markets.getTradeableAToken(asset);
    if (!aToken) return false;

    const config = await this.client.getUserConfiguration(
      H160.fromAny(user),
      aToken.market.pool
    );
    if (!isBorrowingAny(config)) return false;

    const index = await this.markets.getReserveIndex(aToken);
    return isUsingAsCollateral(config, index);
  }

  // =============================================================================
  // Internals
  // =============================================================================

  /**
   * The market a reserve picks, main when omitted or listed nowhere.
   *
   * @param reserve - reserve on-chain id (registry)
   */
  private async getMarket(reserve?: number): Promise<AaveMarket> {
    if (reserve === undefined) return AAVE_MAIN_MARKET;
    const market = await this.markets.getMarket(reserve);
    return market ?? AAVE_MAIN_MARKET;
  }

  private findReserve(summary: AaveSummary, reserve: number): AaveReserveData {
    const reserveCtx = summary.reserves.find((r) => r.reserveId === reserve);
    if (!reserveCtx) throw new Error('Missing reserve ctx for ' + reserve);
    return reserveCtx;
  }

  /**
   * A signed balance change from a decimal amount.
   *
   * @param summary - the user's position in the reserve's market
   * @param reserve - reserve on-chain id (registry)
   * @param amount - decimal amount
   * @param out - the amount leaves the position
   */
  private delta(
    summary: AaveSummary,
    reserve: number,
    amount: string,
    out: boolean
  ): AaveBalanceDelta {
    const reserveCtx = this.findReserve(summary, reserve);
    const native = big.toBigInt(amount, reserveCtx.decimals);
    return { reserve: reserveCtx, amount: out ? -native : native };
  }

  /**
   * Max withdraw of a reserve, within the free balance of a held aToken.
   *
   * @param user - user H160
   * @param summary - the user's position in the reserve's market
   * @param reserve - the reserve to withdraw from
   */
  private async withdrawMax(
    user: string,
    summary: AaveSummary,
    reserve: AaveReserveData
  ): Promise<Amount> {
    const free =
      reserve.aTokenBalance > 0n
        ? await this.markets.getFreeBalance(reserve.aToken, user)
        : undefined;
    return maxWithdraw(summary, reserve, free);
  }

  /**
   * A user's position in one market, projected to the next block.
   *
   * - Ids join through the registry: alias first, then the contract index
   * - A reserve counts as collateral now when flagged, held and given a
   *   liquidation threshold, as Aave's own account data does
   * - A first receipt enables collateral as Aave's automatic rule does:
   *   LTV set, no debt ceiling, user not in isolation mode
   *
   * @param user - user H160
   * @param market - market to read
   * @param timestamp - block timestamp to project from; read when omitted
   */
  private async loadSummary(
    user: string,
    market: AaveMarket,
    timestamp?: number
  ): Promise<AaveSummary> {
    const [poolReserves, userReserves, userData, blockTimestamp, byContract] =
      await Promise.all([
        this.client.getReservesData(market.provider),
        this.client.getUserReservesData(user, market.provider),
        this.client.getUserAccountData(user, market.pool),
        timestamp ?? this.client.getBlockTimestamp(),
        this.erc20.getContracts(),
      ]);

    const [pReserves] = poolReserves;
    const [uReserves, userEmodeCategoryId] = userReserves;
    const [
      totalCollateralBase,
      totalDebtBase,
      ,
      currentLiquidationThreshold,
      ,
      healthFactor,
    ] = userData;

    const byUnderlying = new Map(
      pReserves.map((r) => [lower(r.underlyingAsset), r])
    );

    const collaterals = uReserves.filter(
      (u) => u.usageAsCollateralEnabledOnUser
    );
    const isolated =
      collaterals.length === 1 &&
      (byUnderlying.get(lower(collaterals[0].underlyingAsset))?.debtCeiling ??
        0n) !== 0n;

    const nextBlockTimestamp = blockTimestamp + BLOCK_TIME_SEC;

    const reserves = uReserves.map((uReserve): AaveReserveData => {
      const reserveAsset = lower(uReserve.underlyingAsset);
      const pReserve = byUnderlying.get(reserveAsset);
      if (!pReserve)
        throw new Error('Missing pool reserve for ' + reserveAsset);

      const aTokenBalance = accrueBalance(
        uReserve.scaledATokenBalance,
        pReserve.liquidityIndex,
        pReserve.liquidityRate,
        Number(pReserve.lastUpdateTimestamp),
        nextBlockTimestamp
      );

      const inEmode =
        userEmodeCategoryId !== 0 &&
        userEmodeCategoryId === pReserve.eModeCategoryId;
      const reserveLiquidationThreshold =
        Number(
          inEmode
            ? pReserve.eModeLiquidationThreshold
            : pReserve.reserveLiquidationThreshold
        ) / 10000;

      const held = uReserve.scaledATokenBalance > 0n;
      const flagged = uReserve.usageAsCollateralEnabledOnUser;
      const autoEnables =
        pReserve.baseLTVasCollateral !== 0n &&
        pReserve.debtCeiling === 0n &&
        (collaterals.length === 0 || !isolated);
      const hasThreshold = reserveLiquidationThreshold > 0;

      return {
        aTokenBalance,
        availableLiquidity: pReserve.availableLiquidity,
        decimals: Number(pReserve.decimals),
        isCollateral: held && flagged && hasThreshold,
        priceInRef: pReserve.priceInMarketReferenceCurrency,
        reserveId: assetIdFromAddress(reserveAsset, byContract) ?? null,
        reserveAsset,
        reserveLiquidationThreshold,
        aToken: lower(pReserve.aTokenAddress),
        isCollateralOnSupply: hasThreshold && (held ? flagged : autoEnables),
      };
    });

    return {
      healthFactor: Number(big.toDecimal(healthFactor, 18)),
      currentLiquidationThreshold: Number(
        big.toDecimal(currentLiquidationThreshold, LTV_PRECISION)
      ),
      totalCollateral: totalCollateralBase,
      totalDebt: totalDebtBase,
      reserves,
    };
  }
}
