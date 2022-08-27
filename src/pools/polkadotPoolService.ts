import { Pool, PoolService } from "../types";
import { XykPolkadotClient } from "./xyk/xykPolkadotClient";
import { XykPool } from "./xyk/xykPool";

import { ApiPromise } from "@polkadot/api";

export class PolkadotPoolService implements PoolService {
  private readonly api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  getPools(): Pool[] {
    const pools: Pool[] = [];
    pools.push(new XykPool(new XykPolkadotClient(this.api)));
    return pools;
  }
}
