import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { createSdkContext } from '../../../src';

class GetisolatedFarm extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const isolatedFarm = await sdk.api.farm.getIsolatedFarms(
      '15L6BQ1sMd9pESapK13dHaXBPPtBYnDnKTVhb2gBeGrrJNBx'
    );

    return isolatedFarm;
  }
}

new GetisolatedFarm(ApiUrl.Hydration, 'Get isolated farm').run();
