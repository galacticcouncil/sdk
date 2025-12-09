import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

class GetMostLiquidRoute extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const route = await api.router.getMostLiquidRoute(0, 10);
    console.log(route);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetMostLiquidRoute(ApiUrl.Hydration, 'Get most liquid route').run();
