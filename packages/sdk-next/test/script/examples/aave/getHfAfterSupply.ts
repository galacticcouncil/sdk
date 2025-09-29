import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetHealthFactorAfterSupply extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const result = await api.aave.getHealthFactorAfterSupply(
      BENEFICIARY,
      15, // vDOT
      '16' // Withdraw 16 avDOTs
    );
    console.log(result);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetHealthFactorAfterSupply(
  ApiUrl.Hydration,
  'Get healthh factor after supply'
).run();
