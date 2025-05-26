import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetBestSellMultiExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, tx } = createSdkContext(apiPromise);

    const trade = await api.router.getBestSell('0', '18', '10');
    const tradeTx = await tx.buildTradeTx(trade, BENEFICIARY);
    console.log('Transaction hash: ' + tradeTx.hex);
    return trade;
  }
}

new GetBestSellMultiExample(
  ApiUrl.HydraDx,
  'Get best sell price (Multi)',
  true
).run();
