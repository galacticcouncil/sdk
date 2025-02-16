import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, sor } from '../../../../src';

class GetRoutes extends PapiExecutor {
  async script(client: PolkadotClient) {
    const ctx = new pool.PoolContextProvider(client)
      .withOmnipool()
      .withStableswap()
      .withXyk();

    const router = new sor.Router(ctx);

    const routes = await router.getRoutes(0, 5);
    console.log(routes);

    return () => {
      ctx.destroy();
      client.destroy();
    };
  }
}

new GetRoutes(ApiUrl.Hydration, 'Get routes').run();
