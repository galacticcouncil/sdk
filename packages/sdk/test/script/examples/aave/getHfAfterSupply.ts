import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetHfAfterSupply extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api } = createSdkContext(apiPromise);

    const result = await api.aave.getHealthFactorAfterSupply(
      BENEFICIARY,
      '15', // vDOT
      '16' // supply 16 vDOTs
    );
    console.log(result);
  }
}

new GetHfAfterSupply(ApiUrl.Hydration, 'Get hf after supply', true).run();
