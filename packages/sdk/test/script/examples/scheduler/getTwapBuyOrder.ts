import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

const BENEFICIARY = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';
const MAX_RETRIES = 3;

class GetTwapOrder extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const { tradeScheduler } = createSdkContext(api);

    const twap = await tradeScheduler.getTwapBuyOrder('10', '0', '4000000');
    const twapTx = twap.toTx(BENEFICIARY, MAX_RETRIES);
    console.log('Transaction hash: ' + twapTx.hex);

    const { executionResult } = await twapTx.dryRun(BENEFICIARY);
    console.log('Transaction status: ' + executionResult.isOk);
    return twap.toHuman();
  }
}

new GetTwapOrder(ApiUrl.HydraDx, 'Get Twap BUY order').run();
