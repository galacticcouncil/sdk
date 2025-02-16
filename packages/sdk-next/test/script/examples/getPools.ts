import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { pool } from '../../../src';

class GetPools extends PapiExecutor {
  async script(client: PolkadotClient) {
    const ctx = new pool.PoolContextProvider(client)
      .withOmnipool()
      .withStableswap()
      .withXyk();

    const pools = await ctx.getPools();
    console.log(pools);

    return () => {
      ctx.destroy();
      client.destroy();
    };
  }
}

new GetPools(ApiUrl.Hydration, 'Get pools').run();
