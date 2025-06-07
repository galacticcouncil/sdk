import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

class GetBestSpot extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const spot = await api.router.getSpotPrice(5, 0);
    console.log(spot);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetBestSpot(ApiUrl.Hydration, 'Get best spot').run();
