import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetMawWithdraw extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api } = createSdkContext(apiPromise);

    const result = await api.aave.getMaxWithdraw(BENEFICIARY, '15');
    console.log(result);
  }
}

new GetMawWithdraw(ApiUrl.Hydration, 'Get max withdraw', true).run();
