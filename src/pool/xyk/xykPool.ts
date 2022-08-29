import { Pool, PoolBase, PoolPair, PoolToken, PoolType } from "../../types";
import { BigNumber, bnum } from "../../utils/bignumber";
import mathXyk from "hydra-dx-wasm/build/xyk/nodejs";

export class XykPool implements Pool {
  type: PoolType;
  address: string;
  swapFee: string;
  tokens: PoolToken[];

  static fromPool(pool: PoolBase): XykPool {
    return new XykPool(pool.address, pool.swapFee, pool.tokens);
  }

  constructor(address: string, swapFee: string, tokens: PoolToken[]) {
    this.type = PoolType.XYK;
    this.address = address;
    this.swapFee = swapFee;
    this.tokens = tokens;
  }

  validPair(_tokenIn: string, _tokenOut: string): boolean {
    return true;
  }

  parsePoolPair(tokenIn: string, tokenOut: string): PoolPair {
    throw new Error("Method not implemented.");
  }

  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber): BigNumber {
    throw new Error("Method not implemented.");
  }

  calculateOutGivenIn(poolPair: PoolPair, amountIn: BigNumber): BigNumber {
    throw new Error("Method not implemented.");
  }

  getSpotPrice(poolPair: PoolPair): BigNumber {
    throw new Error("Method not implemented.");
  }
}
