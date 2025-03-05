import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, sor } from '../../../../src';

class GetTradeableAssets extends PapiExecutor {
  async script(client: PolkadotClient) {
    const ctx = new pool.PoolContextProvider(client)
      .withOmnipool()
      .withStableswap()
      .withXyk();

    const router = new sor.Router(ctx);

    const tradeableAssets = await router.getTradeableAssets();
    console.log(tradeableAssets);

    return () => {
      ctx.destroy();
      client.destroy();
    };
  }
}

new GetTradeableAssets(ApiUrl.Hydration, 'Get tradeable assets').run();
