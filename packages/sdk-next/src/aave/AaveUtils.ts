import { big, h160 } from '@galacticcouncil/common';

import { AaveClient } from './AaveClient';
import { AaveMarkets } from './AaveMarkets';
import {
  AaveBalanceDelta,
  accrueBalance,
  isBorrowingAny,
  isUsingAsCollateral,
  maxWithdraw,
  projectHealthFactor,
  toHealthFactor,
} from './AaveMath';
import { AAVE_MARKETS } from './const';
import {
  AaveAToken,
  AaveHealthFactorPreview,
  AaveMarket,
  AaveMarketReserve,
  AaveMarketSummary,
} from './types';

import { Erc20Client } from '../client/Erc20Client';
import { BLOCK_TIME_TARGET } from '../consts';
import { EvmClient } from '../evm';
import { assetIdFromAddress } from '../pool/amm/assetAddress';
import { Amount } from '../types';

const { H160 } = h160;

const BLOCK_TIME_SEC = BLOCK_TIME_TARGET / 1000;
const LTV_PRECISION = 4;

const lower = (a: string) => a.toLowerCase() as `0x${string}`;

/**
 * Aave money market reads, keyed by aToken asset id.
 *
 * - Markets are `AAVE_MARKETS`; their aTokens are listed from the chain
 * - Amounts are decimal strings, health factors plain numbers
 */
export class AaveUtils {
  private client: AaveClient;
  private markets: AaveMarkets;
  private erc20: Erc20Client;

  /**
   * @param evm - EVM client
   * @param erc20 - registry ERC20 index, `balance.erc20` of the context
   */
  constructor(evm: EvmClient, erc20: Erc20Client) {
    this.client = new AaveClient(evm);
    this.erc20 = erc20;
    this.markets = new AaveMarkets(this.client, this.erc20);
  }

  /**
   * Every registered aToken across all markets.
   *
   * - Listed from each market's reserves, once per session
   */
  async getATokens(): Promise<AaveAToken[]> {
    return this.markets.getATokens();
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
   * - `assumeCollateral` is for batches that supply the aToken before moving
   *   it: the supply can enable collateral this read cannot see yet
   *
   * @param user - account moving the asset
   * @param asset - asset id leaving the account
   * @param assumeCollateral - decide on borrowing alone
   */
  async requiresExtraGas(
    user: string,
    asset: number,
    assumeCollateral = false
  ): Promise<boolean> {
    const aToken = await this.markets.getAToken(asset, true);
    if (!aToken) return false;

    const config = await this.client.getUserConfiguration(
      H160.fromAny(user),
      aToken.market.pool
    );
    if (!isBorrowingAny(config)) return false;
    if (assumeCollateral) return true;

    const index = await this.markets.getReserveIndex(aToken);
    return isUsingAsCollateral(config, index);
  }

  /**
   * A user's position in the market of an aToken.
   *
   * @param user - user address
   * @param aToken - aToken asset id
   */
  async getSummary(user: string, aToken: number): Promise<AaveMarketSummary> {
    const { market } = await this.resolve(aToken);
    return this.loadSummary(H160.fromAny(user), market);
  }

  /**
   * A user's health factor in the market of an aToken.
   *
   * @param user - user address
   * @param aToken - aToken asset id
   * @returns health factor, `-1` without debt
   */
  async getHealthFactor(user: string, aToken: number): Promise<number> {
    const { market } = await this.resolve(aToken);
    const [, totalDebt, , , , healthFactor] =
      await this.client.getUserAccountData(H160.fromAny(user), market.pool);
    return toHealthFactor(totalDebt, healthFactor);
  }

  /**
   * Health factor after withdrawing an aToken.
   *
   * - Also the health factor Aave checks when the aToken is swapped away:
   *   the router takes it first, and whatever the swap returns lands after
   *   the check
   *
   * @param user - user address
   * @param aToken - aToken asset id
   * @param amount - aToken amount (decimal)
   */
  async previewWithdraw(
    user: string,
    aToken: number,
    amount: string
  ): Promise<AaveHealthFactorPreview> {
    return this.preview(user, aToken, amount, true);
  }

  /**
   * Health factor after supplying the reserve of an aToken.
   *
   * @param user - user address
   * @param aToken - aToken asset id
   * @param amount - supplied amount (decimal)
   */
  async previewSupply(
    user: string,
    aToken: number,
    amount: string
  ): Promise<AaveHealthFactorPreview> {
    return this.preview(user, aToken, amount, false);
  }

  /**
   * Largest amount of an aToken a user can withdraw.
   *
   * - Keeps the health factor at 1.01, within available liquidity, and within
   *   the unlocked balance of a lockable aToken
   *
   * @param user - user address
   * @param aToken - aToken asset id
   */
  async getMaxWithdraw(user: string, aToken: number): Promise<Amount> {
    const to = H160.fromAny(user);
    const entry = await this.resolve(aToken);
    const [summary, free] = await Promise.all([
      this.loadSummary(to, entry.market),
      this.markets.getFreeBalance(entry.aToken, to),
    ]);
    const reserve = this.findReserve(summary, entry.aToken);
    return maxWithdraw(summary, reserve, free);
  }

  /**
   * Largest withdrawable amount of every aToken, across all markets.
   *
   * - Markets are read in parallel from one block timestamp
   * - Free balances are probed in parallel, held aTokens only
   *
   * @param user - user address
   * @returns max withdraw per aToken asset id, grouped by market
   */
  async getMaxWithdrawAll(user: string): Promise<Map<number, Amount>> {
    const to = H160.fromAny(user);
    const timestamp = await this.client.getBlockTimestamp();

    const rows = await Promise.all(
      AAVE_MARKETS.map(async (market) => {
        const summary = await this.loadSummary(to, market, timestamp);
        return Promise.all(
          summary.reserves.map(async (reserve) => {
            const { aTokenId, aToken, aTokenBalance } = reserve;
            if (aTokenId === null) return null;
            const free =
              aTokenBalance > 0n
                ? await this.markets.getFreeBalance(aToken, to)
                : undefined;
            return [aTokenId, maxWithdraw(summary, reserve, free)] as const;
          })
        );
      })
    );

    const result = new Map<number, Amount>();
    for (const row of rows.flat()) {
      if (row) result.set(row[0], row[1]);
    }
    return result;
  }

  // =============================================================================
  // Internals
  // =============================================================================

  private async resolve(aToken: number): Promise<AaveAToken> {
    const ref = await this.markets.getAToken(aToken);
    if (!ref) throw new Error(`Asset ${aToken} is not an Aave aToken`);
    return ref;
  }

  private findReserve(
    summary: AaveMarketSummary,
    aToken: `0x${string}`
  ): AaveMarketReserve {
    const reserve = summary.reserves.find((r) => r.aToken === aToken);
    if (!reserve) throw new Error(`Missing reserve for ${aToken}`);
    return reserve;
  }

  /**
   * Preview one aToken balance change in its market.
   *
   * @param user - user address
   * @param aToken - aToken asset id
   * @param amount - decimal amount
   * @param out - the amount leaves the position
   */
  private async preview(
    user: string,
    aToken: number,
    amount: string,
    out: boolean
  ): Promise<AaveHealthFactorPreview> {
    const entry = await this.resolve(aToken);
    const summary = await this.loadSummary(H160.fromAny(user), entry.market);
    const reserve = this.findReserve(summary, entry.aToken);

    return {
      current: summary.healthFactor,
      projected: projectHealthFactor(summary, [
        this.delta(reserve, amount, out),
      ]),
    };
  }

  /**
   * A signed balance change from a decimal amount.
   *
   * @param out - the amount leaves the position
   */
  private delta(
    reserve: AaveMarketReserve,
    amount: string,
    out: boolean
  ): AaveBalanceDelta {
    const native = big.toBigInt(amount, reserve.decimals);
    return { reserve, amount: out ? -native : native };
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
  ): Promise<AaveMarketSummary> {
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

    const reserves = uReserves.map((uReserve): AaveMarketReserve => {
      const underlying = lower(uReserve.underlyingAsset);
      const pReserve = byUnderlying.get(underlying);
      if (!pReserve) throw new Error('Missing pool reserve for ' + underlying);

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
      const liquidationThreshold =
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

      const aToken = lower(pReserve.aTokenAddress);
      return {
        aToken,
        aTokenId: byContract.get(aToken) ?? null,
        underlying,
        underlyingId: assetIdFromAddress(underlying, byContract) ?? null,
        aTokenBalance,
        availableLiquidity: pReserve.availableLiquidity,
        decimals: Number(pReserve.decimals),
        priceInRef: pReserve.priceInMarketReferenceCurrency,
        liquidationThreshold,
        isCollateral: held && flagged && liquidationThreshold > 0,
        isCollateralOnSupply:
          liquidationThreshold > 0 && (held ? flagged : autoEnables),
      };
    });

    return {
      market,
      healthFactor: toHealthFactor(totalDebtBase, healthFactor),
      currentLiquidationThreshold: Number(
        big.toDecimal(currentLiquidationThreshold, LTV_PRECISION)
      ),
      totalCollateral: totalCollateralBase,
      totalDebt: totalDebtBase,
      reserves,
    };
  }
}
