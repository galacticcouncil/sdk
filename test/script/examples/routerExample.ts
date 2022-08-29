import { ApiPromise } from "@polkadot/api";
import { PolkadotExecutor } from "../executor";
import { PolkadotPoolService } from "../../../src/pool/polkadotPoolService";
import { TradeRouter } from "../../../src/api/router";

class RouterExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotPoolService(api);
    const router = new TradeRouter(poolService);
    return router.getAllPaths("1", "2");
  }
}

new RouterExample("wss://rpc.basilisk.cloud", "Get all paths").run();
