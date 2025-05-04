import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter, TradeUtils } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetSellExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const txUtils = new TradeUtils(api);

    const router = new TradeRouter(poolService);

    const paths = await router.getAllPaths('0', '5');
    const sortByHopsDesc = paths.sort((a, b) => {
      const swapsA = a.length;
      const swapsB = b.length;
      return swapsA < swapsB ? 1 : -1;
    });

    const trade = await router.getSell('0', '5', 1, sortByHopsDesc[0]);
    const transaction = txUtils.buildSellTx(trade);
    console.log('Transaction hash: ' + transaction.hex);
    return trade;
  }
}

new GetSellExample(ApiUrl.HydraDx, 'Get sell price', true).run();
