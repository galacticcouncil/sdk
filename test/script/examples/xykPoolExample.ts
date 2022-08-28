import { ApiPromise } from "@polkadot/api";
import { PolkadotExecutor } from "../executor";
import { XykPolkadotClient } from "../../../src/pool/xyk/xykPolkadotClient";

class XykPools extends PolkadotExecutor {
  script(api: ApiPromise): Promise<any> {
    return new XykPolkadotClient(api).getPools();
  }
}

new XykPools("wss://rpc.basilisk.cloud", "Return XYK pools", true).run();
