import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { createSdkContext } from '../../../src';
import { PoolType } from '../../../src/pool';

class GetPools extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { ctx } = sdk;

    ctx.pool.withXyk();

    const pools = await ctx.pool.getPools();
    console.log(pools.length);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetPools(ApiUrl.Hydration, 'Get pools').run();
