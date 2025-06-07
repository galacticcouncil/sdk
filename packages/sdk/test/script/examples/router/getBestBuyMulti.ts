import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetBestBuyMultiExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, tx } = createSdkContext(apiPromise);

    const trade = await api.router.getBestBuy('0', '18', '10');
    const tradeTx = await tx.trade(trade).withBeneficiary(BENEFICIARY).build();

    console.log('Transaction hash: ' + tradeTx.hex);
    return trade;
  }
}

new GetBestBuyMultiExample(
  ApiUrl.Nice,
  'Get best buy price (Multi)',
  true
).run();
