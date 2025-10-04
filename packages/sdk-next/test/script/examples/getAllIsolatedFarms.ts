import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { createSdkContext } from '../../../src';

class GetAllIsolatedFarm extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const allFarms = await api.farm.getAllIsolatedFarms();
    console.log(allFarms);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetAllIsolatedFarm(ApiUrl.Hydration, 'Get all isolated farms').run();
