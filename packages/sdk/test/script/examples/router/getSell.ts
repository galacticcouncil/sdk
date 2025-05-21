import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetSellExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const { tradeRouter } = createSdkContext(api);

    const paths = await tradeRouter.getAllPaths('0', '5');
    const sortByHopsDesc = paths.sort((a, b) => {
      const swapsA = a.length;
      const swapsB = b.length;
      return swapsA < swapsB ? 1 : -1;
    });

    const trade = await tradeRouter.getSell('0', '5', 1, sortByHopsDesc[0]);
    const tradeTx = trade.toTx();
    console.log('Transaction hash: ' + tradeTx.hex);
    return trade;
  }
}

new GetSellExample(ApiUrl.HydraDx, 'Get sell price', true).run();
