import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetBestBuyMultiExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const { tradeRouter } = createSdkContext(api);

    const trade = await tradeRouter.getBestBuy('0', '18', '10');
    const tradeTx = trade.toTx();
    console.log('Transaction hash: ' + tradeTx.hex);
    return trade;
  }
}

new GetBestBuyMultiExample(
  ApiUrl.Nice,
  'Get best buy price (Multi)',
  true
).run();
