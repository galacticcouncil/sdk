import { ApiPromise } from "@polkadot/api";
import { PolkadotExecutor } from "../executor";
import { XykPool } from "../../../src/pools/xyk/xykPool";
import { XykPolkadotClient } from "../../../src/pools/xyk/xykPolkadotClient";

class XykPoolPairs extends PolkadotExecutor {
  script(api: ApiPromise): Promise<any> {
    const xykClient = new XykPolkadotClient(api);
    const xykPool = new XykPool(xykClient);
    return xykPool.getPoolPairs();
  }
}

new XykPoolPairs("wss://rpc.basilisk.cloud", "Return XYK pool pairs").run();
