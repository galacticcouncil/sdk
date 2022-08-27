import { Pool, PoolAsset, PoolPair, PoolType } from "../../types";
import { XykClient } from "./xykClient";
import { BigNumber, bnum } from "../../utils/bignumber";
import mathXyk from "hydra-dx-wasm/build/xyk/nodejs";

export class XykPool implements Pool {
  private readonly client: XykClient;
  type: PoolType;

  constructor(client: XykClient) {
    this.type = PoolType.XYK;
    this.client = client;
  }

  assetBalance(assetId: string, assetKey: string): Promise<string> {
    if (assetKey === "0") {
      return this.client.getSystemAccountBalance(assetId);
    } else {
      return this.client.getTokenAccountBalance(assetId, assetKey);
    }
  }

  async getPoolPairs(): Promise<PoolPair[]> {
    const poolAssets = await this.client.getPoolAssets();
    const poolPairs = poolAssets.map(async (asset: PoolAsset) => {
      const exchangeFee = this.client.getExchangeFee();
      const balanceIn = await this.assetBalance(asset.id, asset.assetIn);
      const balanceOut = await this.assetBalance(asset.id, asset.assetOut);
      return {
        id: asset.id,
        address: asset.id,
        poolType: this.type,
        swapFee: bnum(exchangeFee),
        tokenIn: asset.assetIn,
        tokenOut: asset.assetOut,
        balanceIn: bnum(balanceIn),
        balanceOut: bnum(balanceOut),
      } as PoolPair;
    });
    return Promise.all(poolPairs);
  }

  getSellPrice(poolPair: PoolPair, amountIn: BigNumber): BigNumber {
    const price = mathXyk.calculate_in_given_out(
      poolPair.balanceOut.toString(),
      poolPair.balanceIn.toString(),
      amountIn.toString()
    );
    return BigNumber(price);
  }

  getBuyPrice(poolPair: PoolPair, amountOut: BigNumber): BigNumber {
    const price = mathXyk.calculate_out_given_in(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      amountOut.toString()
    );
    return BigNumber(price);
  }

  getSpotPrice(poolPair: PoolPair): BigNumber {
    const oneWithPrecision = "1000";
    const price = mathXyk.get_spot_price(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      oneWithPrecision
    );
    return BigNumber(price).div(oneWithPrecision);
  }
}
