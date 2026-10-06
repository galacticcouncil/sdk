import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetHealthFactorAfterSupply extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const [current, afterSupply] = await Promise.all([
      api.aave.getHealthFactor(BENEFICIARY),
      api.aave.getHealthFactorAfterSupply(
        BENEFICIARY,
        15, // vDOT
        '160' // Withdraw 16 avDOTs
      ),
    ]);

    console.log(current, ' => ', afterSupply);

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
