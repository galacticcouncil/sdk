import { ApiPromise } from "@polkadot/api";
import { PolkadotExecutor } from "../executor";
import { XykPool } from "../../../src/pools/xyk/xykPool";
import { XykPolkadotClient } from "../../../src/pools/xyk/xykPolkadotClient";
import { PoolPair } from "../../../src/types";
import { BigNumber, bnum } from "../../../src/utils/bignumber";

class SpotPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const xykClient = new XykPolkadotClient(api);
    const xykPool = new XykPool(xykClient);
    const poolPairs = await xykPool.getPoolPairs();
    return poolPairs.forEach((pair: PoolPair) => {
      if (pair.tokenIn === "1" && pair.tokenOut === "2") {
        const buyPrice = xykPool.getBuyPrice(pair, BigNumber("15"));
        const sellPrice = xykPool.getSellPrice(pair, BigNumber("15"));
        const getSpotPrice = xykPool.getSpotPrice(pair);
        console.log(pair.balanceIn.toString());
        console.log(pair.balanceOut.toString());

        console.log(
          pair.tokenIn + " => " + pair.tokenOut + " Fee: " + pair.swapFee
        );
        console.log(
          "Buy price: 10 " +
            buyPrice.minus(buyPrice.multipliedBy(pair.swapFee.multipliedBy(10)))
        );
        console.log("Sell price: 10 " + sellPrice);

        console.log("Spot price: 10 " + getSpotPrice.toString());
      }
    });
  }
}

new SpotPriceExample("wss://rpc.basilisk.cloud", "Calculate spot price").run();
