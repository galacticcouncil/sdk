import { Pool, PoolBase, PoolPair, PoolToken, PoolType } from "../../types";
import { BigNumber, bnum, scale } from "../../utils/bignumber";
import mathXyk from "hydra-dx-wasm/build/xyk/nodejs";
import { tradeFee, normalizeAmount } from "../../utils/math";

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
    const tokensMap = new Map(this.tokens.map((token) => [token.id, token]));
    const tokenInMeta = tokensMap.get(tokenIn);
    const tokenOutMeta = tokensMap.get(tokenOut);

    if (tokenInMeta == null) throw new Error("Pool does not contain tokenIn");
    if (tokenOutMeta == null) throw new Error("Pool does not contain tokenOut");

    const balanceIn = bnum(tokenInMeta.balance);
    const balanceOut = bnum(tokenOutMeta.balance);

    return {
      swapFee: tradeFee(this.swapFee),
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      balanceIn: normalizeAmount(balanceIn, tokenInMeta.decimals),
      balanceOut: normalizeAmount(balanceOut, tokenOutMeta.decimals),
    } as PoolPair;
  }

  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber): BigNumber {
    throw new Error("Method not implemented.");
  }

  calculateOutGivenIn(poolPair: PoolPair, amountIn: BigNumber): BigNumber {
    const price = mathXyk.calculate_out_given_in(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      amountIn.toString()
    );
    return bnum(price);
  }

  getSpotPrice(poolPair: PoolPair): BigNumber {
    const oneWithPrecision = "1000";
    const price = mathXyk.get_spot_price(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      scale(bnum(1), 12).toString()
    );
    return bnum(price);
  }
}
