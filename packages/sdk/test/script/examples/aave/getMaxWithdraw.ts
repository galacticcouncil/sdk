import { ApiPromise } from '@polkadot/api';
import { createSdkContext, toDecimals } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetMawWithdraw extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api } = createSdkContext(apiPromise);

    const { amount, decimals } = await api.aave.getMaxWithdraw(
      BENEFICIARY,
      '15'
    );
    console.log(toDecimals(amount, decimals));
  }
}

new GetMawWithdraw(ApiUrl.Hydration, 'Get max withdraw', true).run();
