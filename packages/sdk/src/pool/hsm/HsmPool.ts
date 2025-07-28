import {
  BuyCtx,
  Pool,
  PoolBase,
  PoolError,
  PoolFee,
  PoolFees,
  PoolPair,
  PoolToken,
  PoolType,
  SellCtx,
} from '../types';
import {
  StableMath,
  StableSwap,
  StableSwapBase,
  StableSwapFees,
  StableSwapPair,
} from '../stable';

import { BigNumber, bnum, ONE, scale, ZERO } from '../../utils/bignumber';
import { FeeUtils } from '../../utils/fee';

import { HsmMath } from './HsmMath';

export type HsmPoolFees = StableSwapFees & {
  purchaseFee: PoolFee;
  buyBackFee: PoolFee;
};

export type HsmPoolBase = StableSwapBase & {
  hollarId: string;
  maxBuyPriceCoefficient: BigNumber;
  maxInHolding: BigNumber;
  purchaseFee: PoolFee;
  buyBackFee: PoolFee;
};

export class HsmPool extends StableSwap {
  maxBuyPriceCoefficient: BigNumber;
  maxInHolding: BigNumber;
  hollarId: string;
  purchaseFee: PoolFee;
  buyBackFee: PoolFee;

  private stableswap: StableSwap;

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

    this.stableswap = StableSwap.fromPool(this);
  }

  validatePair(_tokenIn: string, _tokenOut: string): boolean {
    return true;
  }

  parsePair(tokenIn: string, tokenOut: string): StableSwapPair {
    return super.parsePair(tokenIn, tokenOut);
  }

  validateAndBuy(
    poolPair: PoolPair,
    amountOut: BigNumber,
    fees: HsmPoolFees
  ): BuyCtx {
    throw new Error('Method not implemented.');
  }

  validateAndSell(
    poolPair: PoolPair,
    amountIn: BigNumber,
    fees: HsmPoolFees
  ): SellCtx {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const amountOut = this.calculateOutGivenIn(poolPair, amountIn, fees);

    const fee = calculatedOut.minus(amountOut);
    const feePct = fee.div(calculatedOut).multipliedBy(100).decimalPlaces(4);

    const errors: PoolError[] = [];

    return {
      amountIn: amountIn,
      calculatedOut: calculatedOut,
      amountOut: amountOut,
      feePct: feePct.toNumber(),
      errors: errors,
    } as SellCtx;
  }

  calculateInGivenOut(
    poolPair: PoolPair,
    amountOut: BigNumber,
    fees?: HsmPoolFees
  ): BigNumber {
    throw new Error('Method not implemented.');
  }

  private calculateCollateralOutGivenHollarIn(
    poolPair: PoolPair,
    amountIn: BigNumber,
    fees?: HsmPoolFees
  ) {
    const executionPrice = this.stableswap.calculateOutGivenIn(
      poolPair,
      amountIn,
      fees
    );
    // console.log(
    //   amountIn.toFixed(0),
    //   executionPrice.toFixed(0),
    //   fees ? FeeUtils.toRaw(fees.buyBackFee).toString() : ZERO.toString()
    // );

    console.log(
      amountIn.toFixed(0),
      '1/1',
      fees ? FeeUtils.toRaw(fees.buyBackFee).toString() : ZERO.toString()
    );

    const price = HsmMath.calculateCollateralOutGivenHollarIn(
      amountIn.toFixed(0),
      //executionPrice.toFixed(0),
      '1/1',
      fees ? FeeUtils.toRaw(fees.buyBackFee).toString() : ZERO.toString()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  private calculateHollarOutGivenCollateralIn(
    amountIn: BigNumber,
    fees?: HsmPoolFees
  ) {
    const collateralPeg = this.stableswap.getPegs();
    const price = HsmMath.calculateHollarOutGivenCollateralIn(
      amountIn.toFixed(0),
      collateralPeg,
      fees ? FeeUtils.toRaw(fees.purchaseFee).toString() : ZERO.toString()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  calculateOutGivenIn(
    poolPair: PoolPair,
    amountIn: BigNumber,
    fees?: HsmPoolFees
  ): BigNumber {
    if (poolPair.assetIn == this.hollarId) {
      return this.calculateCollateralOutGivenHollarIn(poolPair, amountIn, fees);
    }
    return this.calculateHollarOutGivenCollateralIn(amountIn, fees);
  }

  spotPriceInGivenOut(poolPair: PoolPair): BigNumber {
    return super.spotPriceInGivenOut(poolPair);
  }

  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber {
    return super.spotPriceOutGivenIn(poolPair);
  }
}
