import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { createSdkContext } from '../../../src';

class GetAllOmnipoolFarm extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const allFarms = await api.farm.getAllOmnipoolFarms();
    console.log(allFarms);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetAllOmnipoolFarm(ApiUrl.Hydration, 'Get all omnipool farm').run();
