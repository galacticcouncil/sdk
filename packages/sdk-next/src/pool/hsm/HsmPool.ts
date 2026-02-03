import { big, RUNTIME_DECIMALS } from '@galacticcouncil/common';

import {
  BuyCtx,
  PoolError,
  PoolFee,
  PoolPair,
  PoolType,
  SellCtx,
} from '../types';
import { StableSwap, StableSwapBase, StableSwapPair } from '../stable';

import { fmt } from '../../utils';

import { HsmMath } from './HsmMath';

const { FeeUtils } = fmt;

export type HsmPoolBase = StableSwapBase & {
  hsmAddress: string;
  hsmMintCapacity: bigint;
  hollarId: number;
  hollarH160: string;
  collateralId: number;
  collateralBalance: bigint;
  maxBuyPriceCoefficient: bigint;
  maxInHolding: bigint;
  purchaseFee: PoolFee;
  buyBackFee: PoolFee;
  buyBackRate: PoolFee;
};

export class HsmPool extends StableSwap {
  hsmAddress: string;
  hsmMintCapacity: bigint;
  hollarId: number;
  hollarH160: string;
  collateralId: number;
  collateralBalance: bigint;
  maxBuyPriceCoefficient: bigint;
  maxInHolding: bigint;
  purchaseFee: PoolFee;
  buyBackFee: PoolFee;
  buyBackRate: PoolFee;

  static fromPool(pool: HsmPoolBase): HsmPool {
    return new HsmPool(pool);
  }

  constructor(pool: HsmPoolBase) {
    super(pool);
    this.type = PoolType.HSM;
    this.hsmAddress = pool.hsmAddress;
    this.hsmMintCapacity = pool.hsmMintCapacity;
    this.hollarId = pool.hollarId;
    this.hollarH160 = pool.hollarH160;
    this.collateralId = pool.collateralId;
    this.collateralBalance = pool.collateralBalance;
    this.maxBuyPriceCoefficient = pool.maxBuyPriceCoefficient;
    this.maxInHolding = pool.maxInHolding;
    this.purchaseFee = pool.purchaseFee;
    this.buyBackFee = pool.buyBackFee;
    this.buyBackRate = pool.buyBackRate;
  }

  validatePair(_tokenIn: number, _tokenOut: number): boolean {
    return true;
  }

  parsePair(tokenIn: number, tokenOut: number): StableSwapPair {
    return super.parsePair(tokenIn, tokenOut);
  }

  validateTradeHollarIn(
    poolPair: PoolPair,
    amountIn: bigint,
    amountOut: bigint,
    errors: PoolError[]
  ) {
    const buybackLimit = this.calculateBuybackLimit(poolPair);

    /**
     * Check if the requested amount exceeds the buyback limit
     *
     * amountIn = the amount of Hollar the user is trying to sell to HSM
     * buybackLimit = how much Hollar can be bought back
     */
    if (amountIn > buybackLimit) {
      errors.push(PoolError.MaxBuyBackExceeded);
    }

    const buyPrice = this.calculateBuyPrice(poolPair, amountIn, amountOut);
    const maxPrice = this.calculateMaxPrice(poolPair);

    /**
     * Check if buy price less than max price
     */
    if (buyPrice > maxPrice) {
      errors.push(PoolError.MaxBuyPriceExceeded);
    }

    /**
     * Check if HSM has enough collateral
     */
    if (amountOut > this.collateralBalance) {
      errors.push(PoolError.InsufficientCollateral);
    }

    return errors;
  }

  validateTradeHollarOut(
    amountIn: bigint,
    amountOut: bigint,
    errors: PoolError[]
  ) {
    /**
     * Checks if adding more collateral would exceed the maximum holding limit
     */
    const currentHolding = this.collateralBalance + amountIn;
    if (currentHolding > this.maxInHolding) {
      errors.push(PoolError.MaxHoldingExceeded);
    }

    /**
     * Checks if facilitator capacity is greater than amount of hollar i wanna to mint
     */
    if (amountOut > this.hsmMintCapacity) {
      errors.push(PoolError.FacilitatorCapacityExceeded);
    }

    return errors;
  }

  validateTradeConstraints(
    poolPair: PoolPair,
    amountIn: bigint,
    amountOut: bigint
  ): PoolError[] {
    const errors: PoolError[] = [];

    // Validate Hollar coming into HSM in exchange for collateral
    if (poolPair.assetIn === this.hollarId) {
      return this.validateTradeHollarIn(poolPair, amountIn, amountOut, errors);
    }

    // Validate Hollar going out from HSM in exchange for collateral coming in
    return this.validateTradeHollarOut(amountIn, amountOut, errors);
  }

  validateAndBuy(poolPair: PoolPair, amountOut: bigint): BuyCtx {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const errors = this.validateTradeConstraints(
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

  validateAndSell(poolPair: PoolPair, amountIn: bigint): SellCtx {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const errors = this.validateTradeConstraints(
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
    amountOut: bigint
  ) {
    const buyExecutionPrice = super.calculateInGivenOut(poolPair, amountOut, {
      fee: this.fee,
    });

    const price = HsmMath.calculateHollarInGivenCollateralOut(
      amountOut.toString(),
      buyExecutionPrice.toString(),
      FeeUtils.toRaw(this.buyBackFee).toString()
    );
    return BigInt(price);
  }

  private calculateCollateralInGivenHollarOut(amountOut: bigint): bigint {
    const collateralPeg = this.getCollateralPeg();
    const price = HsmMath.calculateCollateralInGivenHollarOut(
      amountOut.toString(),
      JSON.stringify(collateralPeg),
      FeeUtils.toRaw(this.purchaseFee).toString()
    );
    return BigInt(price);
  }

  calculateInGivenOut(poolPair: PoolPair, amountOut: bigint): bigint {
    if (poolPair.assetOut == this.hollarId) {
      return this.calculateCollateralInGivenHollarOut(amountOut);
    }
    return this.calculateHollarInGivenCollateralOut(poolPair, amountOut);
  }

  private calculateCollateralOutGivenHollarIn(
    poolPair: PoolPair,
    amountIn: bigint
  ) {
    const sellExecutionPrice = super.calculateOutGivenIn(poolPair, amountIn, {
      fee: this.fee,
    });

    const price = HsmMath.calculateCollateralOutGivenHollarIn(
      amountIn.toString(),
      sellExecutionPrice.toString(),
      FeeUtils.toRaw(this.buyBackFee).toString()
    );
    return BigInt(price);
  }

  private calculateHollarOutGivenCollateralIn(amountIn: bigint): bigint {
    const collateralPeg = this.getCollateralPeg();
    const price = HsmMath.calculateHollarOutGivenCollateralIn(
      amountIn.toString(),
      JSON.stringify(collateralPeg),
      FeeUtils.toRaw(this.purchaseFee).toString()
    );
    return BigInt(price);
  }

  calculateOutGivenIn(poolPair: PoolPair, amountIn: bigint): bigint {
    if (poolPair.assetIn == this.hollarId) {
      return this.calculateCollateralOutGivenHollarIn(poolPair, amountIn);
    }
    return this.calculateHollarOutGivenCollateralIn(amountIn);
  }

  private calculateImbalance(poolPair: PoolPair): bigint {
    const collateralPeg = this.getCollateralPeg();
    const imbalance = HsmMath.calculateImbalance(
      poolPair.balanceIn.toString(),
      JSON.stringify(collateralPeg),
      poolPair.balanceOut.toString()
    );
    return BigInt(imbalance);
  }

  private calculateBuybackLimit(poolPair: PoolPair): bigint {
    const imbalance = this.calculateImbalance(poolPair);
    const buybackLimit = HsmMath.calculateBuybackLimit(
      imbalance.toString(),
      FeeUtils.toRaw(this.buyBackRate).toString()
    );
    return BigInt(buybackLimit);
  }

  private calculateBuyPrice(
    poolPair: PoolPair,
    amountIn: bigint,
    amountOut: bigint
  ): bigint {
    const base = big.pow10(
      poolPair.decimalsIn + RUNTIME_DECIMALS - poolPair.decimalsOut
    );
    return (amountOut * base) / amountIn;
  }

  private calculateMaxPrice(poolPair: PoolPair): bigint {
    const collateralPeg = this.getCollateralPeg();
    const maxPrice = HsmMath.calculateMaxPrice(
      JSON.stringify(collateralPeg),
      this.maxBuyPriceCoefficient.toString()
    );
    const [maxNom, maxDenom] = JSON.parse(maxPrice);

    const base = big.pow10(RUNTIME_DECIMALS - poolPair.decimalsOut);
    return (BigInt(maxNom) * base) / BigInt(maxDenom);
  }

  spotPriceInGivenOut(poolPair: PoolPair): bigint {
    const amounOut = big.toBigInt(1, RUNTIME_DECIMALS);
    return this.calculateInGivenOut(poolPair, amounOut);
  }

  spotPriceOutGivenIn(poolPair: PoolPair): bigint {
    const amounIn = big.toBigInt(1, RUNTIME_DECIMALS);
    return this.calculateOutGivenIn(poolPair, amounIn);
  }

  private getCollateralPeg(): string[] {
    const collateralIndex = this.tokens.findIndex(
      (t) => t.id !== this.hollarId
    );
    const collateralPeg = this.pegs[collateralIndex];
    const collateralDecimals = this.tokens[collateralIndex].decimals!;

    if (this.isDefaultPeg(collateralPeg)) {
      return [
        big.toBigInt(1, 18).toString(),
        big.toBigInt(1, collateralDecimals).toString(),
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
