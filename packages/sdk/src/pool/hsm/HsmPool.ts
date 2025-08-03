import {
  BuyCtx,
  PoolError,
  PoolFee,
  PoolPair,
  PoolType,
  SellCtx,
} from '../types';
import { StableSwap, StableSwapBase, StableSwapPair } from '../stable';

import {
  BigNumber,
  bnum,
  ONE,
  scale,
  toDecimals,
  ZERO,
} from '../../utils/bignumber';
import { FeeUtils } from '../../utils/fee';

import { HsmMath } from './HsmMath';

export type HsmPoolBase = StableSwapBase & {
  hollarId: string;
  maxBuyPriceCoefficient: BigNumber;
  maxInHolding: BigNumber;
  purchaseFee: PoolFee;
  buyBackFee: PoolFee;
  buyBackRate: string;
};

export class HsmPool extends StableSwap {
  maxBuyPriceCoefficient: BigNumber;
  maxInHolding: BigNumber;
  hollarId: string;
  purchaseFee: PoolFee;
  buyBackFee: PoolFee;
  buyBackRate: string;

  static fromPool(pool: HsmPoolBase): HsmPool {
    return new HsmPool(pool);
  }

  constructor(pool: HsmPoolBase) {
    super(pool);
    this.type = PoolType.HSM;
    this.maxBuyPriceCoefficient = pool.maxBuyPriceCoefficient;
    this.maxInHolding = pool.maxInHolding;
    this.hollarId = pool.hollarId;
    this.purchaseFee = pool.purchaseFee;
    this.buyBackFee = pool.buyBackFee;
    this.buyBackRate = pool.buyBackRate;
  }

  validatePair(_tokenIn: string, _tokenOut: string): boolean {
    return true;
  }

  parsePair(tokenIn: string, tokenOut: string): StableSwapPair {
    return super.parsePair(tokenIn, tokenOut);
  }

  validateAndBuy(poolPair: PoolPair, amountOut: BigNumber): BuyCtx {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const errors: PoolError[] = [];

    if (poolPair.assetIn == this.hollarId) {
      const collateralPeg = this.getCollateralPeg();
      const inbalance = HsmMath.calculateImbalance(
        poolPair.balanceIn.toString(),
        JSON.stringify(collateralPeg),
        poolPair.balanceOut.toString()
      );

      const buybackLimit = HsmMath.calculateBuybackLimit(
        bnum(inbalance).toString(),
        this.buyBackRate
      );

      console.log(inbalance, buybackLimit);

      /**
       * Check if the requested amount exceeds the buyback limit
       *
       * calculatedIn = the amount of Hollar the user is trying to sell to HSM
       * buybackLimit = how much Hollar can be bought back
       */
      if (calculatedIn.gt(bnum(buybackLimit))) {
        errors.push(PoolError.MaxBuyBackExceeded);
      }
    }

    return {
      amountIn: calculatedIn,
      calculatedIn: calculatedIn,
      amountOut: amountOut,
      feePct: 0,
      errors: errors,
    } as BuyCtx;
  }

  validateAndSell(poolPair: PoolPair, amountIn: BigNumber): SellCtx {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const errors: PoolError[] = [];

    if (poolPair.assetIn == this.hollarId) {
      const collateralPeg = this.getCollateralPeg();
      const inbalance = HsmMath.calculateImbalance(
        poolPair.balanceIn.toString(),
        JSON.stringify(collateralPeg),
        poolPair.balanceOut.toString()
      );

      const buybackLimit = HsmMath.calculateBuybackLimit(
        bnum(inbalance).toString(),
        this.buyBackRate
      );

      /**
       * Check if the requested amount exceeds the buyback limit
       *
       * amountIn = the amount of Hollar the user is trying to sell to HSM
       * buybackLimit = how much Hollar can be bought back
       */
      if (amountIn.gt(bnum(buybackLimit))) {
        errors.push(PoolError.MaxBuyBackExceeded);
      }

      const aIn = amountIn.dividedBy(bnum(10).pow(poolPair.decimalsIn));
      const aOut = calculatedOut.dividedBy(bnum(10).pow(poolPair.decimalsOut));
      const buyFmt = aOut.dividedBy(aIn);

      const maxPrice = HsmMath.calculateMaxPrice(
        JSON.stringify(collateralPeg),
        this.maxBuyPriceCoefficient.toFixed(0)
      );
      const [maxNom, maxDenom] = JSON.parse(maxPrice);
      const max = bnum(maxNom).div(bnum(maxDenom));
      const maxFmt = max.shiftedBy(-1 * poolPair.decimalsOut);

      /**
       * Check if buy price less than max price
       *
       * buyFmt = actual buy price
       * maxFmt = max buy price
       */
      if (buyFmt.gt(maxFmt)) {
        errors.push(PoolError.MaxBuyPriceExceeded);
      }
    }

    return {
      amountIn: amountIn,
      calculatedOut: calculatedOut,
      amountOut: calculatedOut,
      feePct: 0,
      errors: errors,
    } as SellCtx;
  }

  private calculateHollarInGivenCollateralOut(
    poolPair: PoolPair,
    amountOut: BigNumber
  ) {
    const buyExecutionPrice = super.calculateInGivenOut(poolPair, amountOut, {
      fee: this.fee,
    });

    const price = HsmMath.calculateHollarInGivenCollateralOut(
      amountOut.toFixed(0),
      buyExecutionPrice.toFixed(0),
      FeeUtils.toRaw(this.buyBackFee).toString()
    );
    return bnum(price);
  }

  private calculateCollateralInGivenHollarOut(
    poolPair: PoolPair,
    amountOut: BigNumber
  ): BigNumber {
    const collateralPeg = this.getCollateralPeg();
    const price = HsmMath.calculateCollateralInGivenHollarOut(
      amountOut.toFixed(0),
      JSON.stringify(collateralPeg),
      FeeUtils.toRaw(this.purchaseFee).toString()
    );
    return bnum(price);
  }

  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber): BigNumber {
    if (poolPair.assetOut == this.hollarId) {
      return this.calculateCollateralInGivenHollarOut(poolPair, amountOut);
    }
    return this.calculateHollarInGivenCollateralOut(poolPair, amountOut);
  }

  private calculateCollateralOutGivenHollarIn(
    poolPair: PoolPair,
    amountIn: BigNumber
  ) {
    const sellExecutionPrice = super.calculateOutGivenIn(poolPair, amountIn, {
      fee: this.fee,
    });

    const price = HsmMath.calculateCollateralOutGivenHollarIn(
      amountIn.toFixed(0),
      sellExecutionPrice.toFixed(0),
      FeeUtils.toRaw(this.buyBackFee).toString()
    );
    return bnum(price);
  }

  private calculateHollarOutGivenCollateralIn(
    poolPair: PoolPair,
    amountIn: BigNumber
  ): BigNumber {
    const collateralPeg = this.getCollateralPeg();
    const price = HsmMath.calculateHollarOutGivenCollateralIn(
      amountIn.toFixed(0),
      JSON.stringify(collateralPeg),
      FeeUtils.toRaw(this.purchaseFee).toString()
    );
    return bnum(price);
  }

  calculateOutGivenIn(poolPair: PoolPair, amountIn: BigNumber): BigNumber {
    if (poolPair.assetIn == this.hollarId) {
      return this.calculateCollateralOutGivenHollarIn(poolPair, amountIn);
    }
    return this.calculateHollarOutGivenCollateralIn(poolPair, amountIn);
  }

  spotPriceInGivenOut(poolPair: PoolPair): BigNumber {
    const amounOut = scale(ONE, poolPair.decimalsOut);
    return this.calculateInGivenOut(poolPair, amounOut);
  }

  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber {
    const amounIn = scale(ONE, poolPair.decimalsIn);
    return this.calculateOutGivenIn(poolPair, amounIn);
  }

  private getCollateralPeg(): string[] {
    const collateralIndex = this.tokens.findIndex(
      (t) => t.id !== this.hollarId
    );
    const collateralPeg = this.pegs[collateralIndex];
    const collateralDecimals = this.tokens[collateralIndex].decimals;

    if (this.isDefaultPeg(collateralPeg)) {
      return [
        scale(ONE, 18).toString(),
        scale(ONE, collateralDecimals).toString(),
      ];
    }
    return collateralPeg;
  }

  private isDefaultPeg(peg: string[]): boolean {
    const [pegNum, pegDen] = peg;
    return (
      Array.isArray(peg) && peg.length === 2 && pegNum === '1' && pegDen === '1'
    );
  }
}
