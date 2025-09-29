import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetMaxWithdrawAll extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const result = await api.aave.getMaxWithdrawAll(BENEFICIARY);
    for (const [key, value] of Object.entries(result)) {
      console.log(key, '=>', value);
    }

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetMaxWithdrawAll(ApiUrl.Hydration, 'Get max withdraw all').run();
