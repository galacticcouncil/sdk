import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetHfAfterWithdraw extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api } = createSdkContext(apiPromise);

    const result = await api.aave.getHealthFactorAfterWithdraw(
      BENEFICIARY,
      '15', // vDOT
      '16' // Withdraw 16 avDOTs
    );
    console.log(result);
  }
}

new GetHfAfterWithdraw(ApiUrl.Hydration, 'Get hf after withdraw', true).run();
