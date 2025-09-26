import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { createSdkContext } from '../../../src';

class GetAllOmnipoolFarm extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);
    const allFarms = await sdk.api.farm.getAllOmnipoolFarms();

    return allFarms;
  }
}

new GetAllOmnipoolFarm(ApiUrl.Hydration, 'Get all omnipool farm').run();
