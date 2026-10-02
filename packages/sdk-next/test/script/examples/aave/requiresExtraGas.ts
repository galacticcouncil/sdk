import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class RequiresExtraGas extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    // aDOT (main market), aBIL (BIL market)
    for (const asset of [1001, 55]) {
      const required = await api.aave.requiresExtraGas(BENEFICIARY, asset);
      console.log(asset, required);
    }

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new RequiresExtraGas(ApiUrl.Hydration, 'Aave extra gas per asset').run();
