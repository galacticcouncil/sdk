import { ApiPromise } from '@polkadot/api';

import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY, DAY_MS, MAX_RETRIES } from '../../const';
import { ApiUrl } from '../../types';

class GetDcaOrder extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, tx } = createSdkContext(apiPromise);

    const order = await api.scheduler.getDcaOrder('10', '0', '10', DAY_MS);
    const orderTx = await tx
      .order(order)
      .withBeneficiary(BENEFICIARY)
      .withMaxRetries(MAX_RETRIES)
      .build();
    console.log('Transaction hash: ' + orderTx.hex);

    const { executionResult } = await orderTx.dryRun(BENEFICIARY);
    console.log('Transaction status: ' + executionResult.isOk);
    return order.toHuman();
  }
}

new GetDcaOrder(ApiUrl.HydraDx, 'Get DCA order').run();
