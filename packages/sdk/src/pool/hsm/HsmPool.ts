import {
  BuyCtx,
  PoolError,
  PoolFee,
  PoolPair,
  PoolType,
  SellCtx,
} from '../types';
import { StableSwap, StableSwapBase, StableSwapPair } from '../stable';

import { BigNumber, bnum, ONE, scale } from '../../utils/bignumber';
import { FeeUtils } from '../../utils/fee';

import { HsmMath } from './HsmMath';

export type HsmPoolBase = StableSwapBase & {
  hollarId: string;
  maxBuyPriceCoefficient: BigNumber;
  maxInHolding: BigNumber;
  purchaseFee: PoolFee;
  buyBackFee: PoolFee;
  buyBackRate: PoolFee;
};

export class HsmPool extends StableSwap {
  maxBuyPriceCoefficient: BigNumber;
  maxInHolding: BigNumber;
  hollarId: string;
  purchaseFee: PoolFee;
  buyBackFee: PoolFee;
  buyBackRate: PoolFee;

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

  validateBuyConstraints(
    poolPair: PoolPair,
    amountIn: BigNumber,
    amountOut: BigNumber
  ): PoolError[] {
    const errors: PoolError[] = [];

    if (poolPair.assetIn === this.hollarId) {
      const buybackLimit = this.calculateBuybackLimit(poolPair);

      /**
       * Check if the requested amount exceeds the buyback limit
       *
       * amountIn = the amount of Hollar the user is trying to sell to HSM
       * buybackLimit = how much Hollar can be bought back
       */
      if (amountIn.gt(buybackLimit)) {
        errors.push(PoolError.MaxBuyBackExceeded);
      }

      const buyPrice = this.calculateBuyPrice(poolPair, amountIn, amountOut);
      const maxPrice = this.calculateMaxPrice(poolPair);

      /**
       * Check if buy price less than max price
       */
      if (buyPrice.gt(maxPrice)) {
        errors.push(PoolError.MaxBuyPriceExceeded);
      }
    }

    return errors;
  }

  validateAndBuy(poolPair: PoolPair, amountOut: BigNumber): BuyCtx {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const errors = this.validateBuyConstraints(
      poolPair,
      calculatedIn,
      amountOut
    );

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
    const errors = this.validateBuyConstraints(
      poolPair,
      amountIn,
      calculatedOut
    );

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

  private calculateCollateralInGivenHollarOut(amountOut: BigNumber): BigNumber {
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
      return this.calculateCollateralInGivenHollarOut(amountOut);
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

  private calculateHollarOutGivenCollateralIn(amountIn: BigNumber): BigNumber {
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
    return this.calculateHollarOutGivenCollateralIn(amountIn);
  }

  private calculateImbalance(poolPair: PoolPair): BigNumber {
    const collateralPeg = this.getCollateralPeg();
    const imbalance = HsmMath.calculateImbalance(
      poolPair.balanceIn.toString(),
      JSON.stringify(collateralPeg),
      poolPair.balanceOut.toString()
    );
    return bnum(imbalance);
  }

  private calculateBuybackLimit(poolPair: PoolPair): BigNumber {
    const imbalance = this.calculateImbalance(poolPair);
    const buybackLimit = HsmMath.calculateBuybackLimit(
      imbalance.toString(),
      FeeUtils.toRaw(this.buyBackRate).toString()
    );
    return bnum(buybackLimit);
  }

  private calculateBuyPrice(
    poolPair: PoolPair,
    amountIn: BigNumber,
    amountOut: BigNumber
  ): BigNumber {
    const aIn = amountIn.dividedBy(bnum(10).pow(poolPair.decimalsIn));
    const aOut = amountOut.dividedBy(bnum(10).pow(poolPair.decimalsOut));
    return aOut.dividedBy(aIn);
  }

  private calculateMaxPrice(poolPair: PoolPair): BigNumber {
    const collateralPeg = this.getCollateralPeg();
    const maxPrice = HsmMath.calculateMaxPrice(
      JSON.stringify(collateralPeg),
      this.maxBuyPriceCoefficient.toFixed(0)
    );
    const [maxNom, maxDenom] = JSON.parse(maxPrice);
    const max = bnum(maxNom).div(bnum(maxDenom));
    return max.shiftedBy(-1 * poolPair.decimalsOut);
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
