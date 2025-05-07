import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter, TradeUtils } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetBuyExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const txUtils = new TradeUtils(api);

    const router = new TradeRouter(poolService);

    const paths = await router.getAllPaths('1', '10');
    const sortByHopsDesc = paths.sort((a, b) => {
      const swapsA = a.length;
      const swapsB = b.length;
      return swapsA < swapsB ? 1 : -1;
    });

    const trade = await router.getBuy('1', '10', 10, sortByHopsDesc[0]);
    const transaction = txUtils.buildBuyTx(trade);
    console.log('Transaction hash: ' + transaction.hex);
    return trade;
  }
}

new GetBuyExample(ApiUrl.HydraDx, 'Get best buy price HydraDX', true).run();
