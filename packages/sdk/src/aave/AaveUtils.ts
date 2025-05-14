import { AaveClient } from './AaveClient';

import { H160 } from '../utils/h160';
import { ERC20 } from '../utils/erc20';

import { bnum, BigNumber, ZERO } from '../utils/bignumber';
import { Amount } from '../types';
import { AaveCtx } from './types';

const RAY = bnum('1e27');
const ORACLE_DECIMALS = bnum('1e8');
const SECONDS_PER_YEAR = bnum('31536000');
const MAX_HF = bnum('999999999'); // close to 1 billion
const TARGET_HF = bnum('1.01');

export class AaveUtils {
  private client: AaveClient;

  constructor() {
    this.client = new AaveClient();
  }

  private async loadCtx(user: string, reserve: string): Promise<AaveCtx> {
    const to = H160.fromAny(user);
    const reserveAsset = ERC20.fromAssetId(reserve);

    const [poolReserves, userReserves, userData] = await Promise.all([
      this.client.getReservesData(),
      this.client.getUserReservesData(to),
      this.client.getUserAccountData(to),
    ]);

    const [totalCollateralBase, totalDebtBase] = userData;
    const [pReserves] = poolReserves;
    const [uReserves, userEmodeCategoryId] = userReserves;

    const pReserve = pReserves.find(
      ({ underlyingAsset }) =>
        underlyingAsset.toLowerCase() === reserveAsset.toLowerCase()
    );
    const uReserve = uReserves.find(
      ({ underlyingAsset }) =>
        underlyingAsset.toLowerCase() === reserveAsset.toLowerCase()
    );

    if (!pReserve || !uReserve) {
      throw new Error('Missing reserve or userReserve for ' + reserve);
    }

    const decimals = Number(pReserve.decimals);
    const priceInRef = bnum(pReserve.priceInMarketReferenceCurrency);

    const reserveLiquidationThreshold = bnum(
      userEmodeCategoryId === pReserve.eModeCategoryId
        ? pReserve.eModeLiquidationThreshold
        : pReserve.reserveLiquidationThreshold
    ).div(10000);

    const liquidityIndex = bnum(pReserve.liquidityIndex);
    const scaledBalance = bnum(uReserve.scaledATokenBalance);

    const totalCollateral = bnum(totalCollateralBase);
    const totalDebt = bnum(totalDebtBase);

    const isCollateralAsset =
      pReserve.usageAsCollateralEnabled &&
      uReserve.usageAsCollateralEnabledOnUser &&
      bnum(uReserve.scaledATokenBalance).gt(0);

    const userBalance = scaledBalance
      .multipliedBy(liquidityIndex)
      .dividedBy(RAY)
      .decimalPlaces(0, BigNumber.ROUND_DOWN);

    return {
      decimals,
      isCollateralAsset,
      priceInRef,
      reserveLiquidationThreshold,
      totalCollateralBase: totalCollateral,
      totalDebtBase: totalDebt,
      userBalance,
    };
  }

  async getMaxWithdraw(user: string, reserve: string): Promise<Amount> {
    const {
      decimals,
      priceInRef,
      reserveLiquidationThreshold,
      totalCollateralBase,
      totalDebtBase,
      userBalance,
    } = await this.loadCtx(user, reserve);

    const totalCollateral = bnum(totalCollateralBase);
    const totalDebt = bnum(totalDebtBase);

    const requiredCollateral = TARGET_HF.multipliedBy(totalDebt)
      .div(reserveLiquidationThreshold)
      .decimalPlaces(0, BigNumber.ROUND_UP);

    const withdrawableRef = totalCollateral
      .minus(requiredCollateral)
      .decimalPlaces(0, 1);

    const withdrawableTokens = withdrawableRef
      .multipliedBy(bnum(10).pow(decimals)) // apply token decimals
      .dividedBy(priceInRef) // divide by ref price decimals
      .decimalPlaces(0, BigNumber.ROUND_DOWN);

    const maxWithdrawable = BigNumber.minimum(userBalance, withdrawableTokens);

    return {
      amount: maxWithdrawable,
      decimals,
    } as Amount;
  }

  async getHealthFactorAfterWithdraw(
    user: string,
    reserve: string,
    withdrawAmount: BigNumber
  ): Promise<number> {
    const {
      decimals,
      isCollateralAsset,
      priceInRef,
      reserveLiquidationThreshold,
      totalCollateralBase,
      totalDebtBase,
    } = await this.loadCtx(user, reserve);

    // Convert withdraw amount to reference currency units
    const withdrawRef = isCollateralAsset
      ? bnum(withdrawAmount)
          .multipliedBy(priceInRef)
          .dividedBy(bnum(10).pow(decimals))
          .decimalPlaces(0, BigNumber.ROUND_DOWN)
      : ZERO;

    const adjustedCollateral = totalCollateralBase.minus(withdrawRef);

    // HF = 0 if no collateral
    if (adjustedCollateral.lte(0)) return 0;

    // HF = (C * LT) / D
    const healthFactor = adjustedCollateral
      .multipliedBy(reserveLiquidationThreshold)
      .dividedBy(totalDebtBase)
      .decimalPlaces(6, BigNumber.ROUND_DOWN);

    return healthFactor.toNumber();
  }

  async getHealthFactorAfterSupply(
    user: string,
    reserve: string,
    supplyAmount: BigNumber
  ): Promise<number> {
    const {
      decimals,
      priceInRef,
      reserveLiquidationThreshold,
      totalCollateralBase,
      totalDebtBase,
    } = await this.loadCtx(user, reserve);

    // Convert supply amount to reference currency units
    const supplyRef = bnum(supplyAmount)
      .multipliedBy(priceInRef)
      .dividedBy(bnum(10).pow(decimals))
      .decimalPlaces(0, BigNumber.ROUND_DOWN);

    const newCollateral = totalCollateralBase.plus(supplyRef);

    // Avoid division by zero
    if (newCollateral.lte(0)) return 0;

    // HF = (C * LT) / B
    const healthFactor = newCollateral
      .multipliedBy(reserveLiquidationThreshold)
      .dividedBy(totalDebtBase)
      .decimalPlaces(6, BigNumber.ROUND_DOWN);

    return healthFactor.toNumber();
  }
}
