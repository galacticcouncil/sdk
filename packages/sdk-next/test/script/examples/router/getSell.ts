import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

class GetSell extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const routes = await api.router.getRoutes(10, 5);
    const sortByHopsAsc = routes.sort((a, b) => {
      const swapsA = a.length;
      const swapsB = b.length;
      return swapsA < swapsB ? -1 : 1;
    });

    const sell = await api.router.getSell(10, 5, 10_000_000n, sortByHopsAsc[0]);
    console.log(sell.toHuman());

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetSell(ApiUrl.Hydration, 'Get sell').run();
