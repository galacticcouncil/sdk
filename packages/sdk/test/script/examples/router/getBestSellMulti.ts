import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetBestSellMultiExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const { tradeRouter } = createSdkContext(api);

    const trade = await tradeRouter.getBestSell('0', '18', '10');
    const tradeTx = trade.toTx();
    console.log('Transaction hash: ' + tradeTx.hex);
    return trade;
  }
}

new GetBestSellMultiExample(
  ApiUrl.HydraDx,
  'Get best sell price (Multi)',
  true
).run();
