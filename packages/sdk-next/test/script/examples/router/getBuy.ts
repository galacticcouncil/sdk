import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

class GetBuy extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const routes = await api.router.getRoutes(10, 5);
    const sortByHopsAsc = routes.sort((a, b) => {
      const swapsA = a.length;
      const swapsB = b.length;
      return swapsA < swapsB ? -1 : 1;
    });

    const trade = await api.router.getBuy(
      10,
      5,
      100_000_000_000n,
      sortByHopsAsc[0]
    );
    console.log(trade.toHuman());

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetBuy(ApiUrl.Hydration, 'Get buy').run();
