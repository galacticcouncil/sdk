import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { createSdkContext } from '../../../src';

class GetOmnipoolFarm extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const omnipoolFarm = await api.farm.getOmnipoolFarms('5');
    console.log(omnipoolFarm);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetOmnipoolFarm(ApiUrl.Hydration, 'Get omnipool farm').run();
