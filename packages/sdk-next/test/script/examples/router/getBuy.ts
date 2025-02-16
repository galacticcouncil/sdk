import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, sor } from '../../../../src';

class GetBuy extends PapiExecutor {
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

    const buy = await router.getBuy(10, 5, 100_000_000_000n, sortByHopsAsc[0]);
    console.log(buy.toHuman());

    return () => {
      ctx.destroy();
      client.destroy();
    };
  }
}

new GetBuy(ApiUrl.Hydration, 'Get buy').run();
