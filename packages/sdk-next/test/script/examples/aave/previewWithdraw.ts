import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class PreviewWithdraw extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    // aBIL: checked against the BIL market
    const preview = await api.aave.previewWithdraw(BENEFICIARY, 55, '10');
    console.log(preview);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new PreviewWithdraw(ApiUrl.Hydration, 'Health factor after withdraw').run();
