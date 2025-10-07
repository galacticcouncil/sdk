import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetHealthFactorAfterWithdraw extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const [current, afterWithdraw] = await Promise.all([
      api.aave.getHealthFactor(BENEFICIARY),
      api.aave.getHealthFactorAfterWithdraw(
        BENEFICIARY,
        15, // vDOT
        '160' // Withdraw 16 avDOTs
      ),
    ]);

    console.log(current, ' => ', afterWithdraw);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetHealthFactorAfterWithdraw(
  ApiUrl.Hydration,
  'Get healthh factor after withdraw'
).run();
