import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, sor } from '../../../../src';

class GetSell extends PapiExecutor {
  async script(client: PolkadotClient) {
    const ctx = new pool.PoolContextProvider(client)
      .withOmnipool()
      .withStableswap()
      .withXyk();

    const router = new sor.TradeRouter(ctx);

    const routes = await router.getRoutes(10, 5);
    const sortByHopsAsc = routes.sort((a, b) => {
      const swapsA = a.length;
      const swapsB = b.length;
      return swapsA < swapsB ? -1 : 1;
    });

    const sell = await router.getSell(10, 5, 10_000_000n, sortByHopsAsc[0]);
    console.log(sell.toHuman());

    return () => {
      ctx.destroy();
      client.destroy();
    };
  }
}

new GetSell(ApiUrl.Hydration, 'Get sell').run();
