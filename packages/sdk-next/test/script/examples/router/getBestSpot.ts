import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, sor } from '../../../../src';

class GetBestSpot extends PapiExecutor {
  async script(client: PolkadotClient) {
    const ctx = new pool.PoolContextProvider(client)
      .withOmnipool()
      .withStableswap()
      .withXyk();

    const router = new sor.TradeRouter(ctx);

    const spot = await router.getBestSpotPrice(0, 10);
    console.log(spot);

    setInterval(async () => {
      const spot = await router.getBestSpotPrice(0, 10);
      console.log(spot);
    }, 10000);

    return () => {
      /*    ctx.destroy();
      client.destroy(); */
    };
  }
}

new GetBestSpot(ApiUrl.Hydration, 'Get best spot').run();
