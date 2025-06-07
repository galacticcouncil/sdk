import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY, MAX_RETRIES } from '../../const';
import { ApiUrl } from '../../types';

class GetTwapOrder extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, tx } = createSdkContext(apiPromise);

    const twap = await api.scheduler.getTwapBuyOrder('10', '0', '4000000');
    const twapTx = await tx
      .order(twap)
      .withBeneficiary(BENEFICIARY)
      .withMaxRetries(MAX_RETRIES)
      .build();
    console.log('Transaction hash: ' + twapTx.hex);

    const { executionResult } = await twapTx.dryRun(BENEFICIARY);
    console.log('Transaction status: ' + executionResult.isOk);
    return twap.toHuman();
  }
}

new GetTwapOrder(ApiUrl.HydraDx, 'Get Twap BUY order').run();
