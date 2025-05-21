import { ApiPromise } from '@polkadot/api';

import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

const BENEFICIARY = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';
const MAX_RETRIES = 3;

const DAY_PERIOD = 24 * 60 * 60 * 1000;

class GetDcaOrder extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const { tradeScheduler } = createSdkContext(api);

    const order = await tradeScheduler.getDcaOrder('10', '0', '10', DAY_PERIOD);
    const orderTx = order.toTx(BENEFICIARY, MAX_RETRIES);
    console.log('Transaction hash: ' + orderTx.hex);

    const { executionResult } = await orderTx.dryRun(BENEFICIARY);
    console.log('Transaction status: ' + executionResult.isOk);
    return order.toHuman();
  }
}

new GetDcaOrder(ApiUrl.HydraDx, 'Get DCA order').run();
