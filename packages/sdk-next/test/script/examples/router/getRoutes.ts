import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

class GetRoutes extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const routes = await api.router.getRoutes(0, 5);
    console.log(routes);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetRoutes(ApiUrl.Hydration, 'Get routes').run();
