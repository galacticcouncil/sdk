import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY, MAX_RETRIES } from '../../const';
import { ApiUrl } from '../../types';

class GetTwapOrder extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, tx } = createSdkContext(apiPromise);

    const twap = await api.scheduler.getTwapSellOrder('10', '0', '50000');
    const twapTx = tx.buildOrderTx(twap, BENEFICIARY, MAX_RETRIES);
    console.log('Transaction hash: ' + twapTx.hex);

    const { executionResult } = await twapTx.dryRun(BENEFICIARY);
    console.log('Transaction status: ' + executionResult.isOk);
    return twap.toHuman();
  }
}

new GetTwapOrder(ApiUrl.HydraDx, 'Get Twap SELL order').run();
