import { ApiPromise } from '@polkadot/api';
import { createSdkContext, toDecimals } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetMawWithdrawAll extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api } = createSdkContext(apiPromise);

    const result = await api.aave.getMaxWithdrawAll(BENEFICIARY);
    for (const [key, value] of Object.entries(result)) {
      console.log(key, '=>', toDecimals(value.amount, value.decimals));
    }
  }
}

new GetMawWithdrawAll(ApiUrl.Hydration, 'Get max withdraw all', true).run();
