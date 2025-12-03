import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { createSdkContext } from '../../../src';

class GetisolatedFarm extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const isolatedFarm = await api.farm.getIsolatedFarms(
      '15nzS2D2wJdh52tqZdUJVMeDQqQe7wJfo5NZKL7pUxhwYgwq'
    );
    console.log(isolatedFarm);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetisolatedFarm(ApiUrl.Hydration, 'Get isolated farm').run();
