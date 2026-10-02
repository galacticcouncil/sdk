import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class PreviewSupply extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    // aDOT: supply 10 DOT to the main market
    const preview = await api.aave.previewSupply(BENEFICIARY, 1001, '10');
    console.log(preview);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new PreviewSupply(ApiUrl.Hydration, 'Health factor after supply').run();
