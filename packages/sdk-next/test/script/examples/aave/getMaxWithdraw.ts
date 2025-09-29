import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetMaxWithdraw extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const result = await api.aave.getMaxWithdraw(BENEFICIARY, 15);
    console.log(result);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetMaxWithdraw(ApiUrl.Hydration, 'Get max withdraw').run();
