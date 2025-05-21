import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetBuyExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const { tradeRouter } = createSdkContext(api);

    const paths = await tradeRouter.getAllPaths('1', '10');
    const sortByHopsDesc = paths.sort((a, b) => {
      const swapsA = a.length;
      const swapsB = b.length;
      return swapsA < swapsB ? 1 : -1;
    });

    const trade = await tradeRouter.getBuy('1', '10', 10, sortByHopsDesc[0]);
    const tradeTx = trade.toTx();
    console.log('Transaction hash: ' + tradeTx.hex);
    return trade;
  }
}

new GetBuyExample(ApiUrl.HydraDx, 'Get best buy price HydraDX', true).run();
