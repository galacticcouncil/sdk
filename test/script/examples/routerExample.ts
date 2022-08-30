import { ApiPromise } from "@polkadot/api";
import { PolkadotExecutor } from "../executor";
import { PolkadotPoolService } from "../../../src/pool/polkadotPoolService";
import { Router } from "../../../src/api/router";
import { bnum, scale } from "../../../src/utils/bignumber";

class RouterExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotPoolService(api);
    const router = new Router(poolService);
    //return router.getAllPaths("1", "2");

    return router.getBestSellPrice("1", "2", scale(bnum("1"), 12));
  }
}

new RouterExample("wss://rpc.basilisk.cloud", "Get all paths").run();
