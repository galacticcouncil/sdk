import { ApiPromise } from '@polkadot/api';
import {
  PoolService,
  PoolType,
  TradeRouter,
  TradeUtils,
} from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetBestSellMultiExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const txUtils = new TradeUtils(api);

    const router = new TradeRouter(poolService, {
      includeOnly: [PoolType.Omni, PoolType.Stable],
    });

    const trade = await router.getBestSell('0', '18', '10');
    const transaction = txUtils.buildSellTx(trade);
    console.log('Transaction hash: ' + transaction.hex);
    return trade;
  }
}

new GetBestSellMultiExample(
  ApiUrl.HydraDx,
  'Get best sell price (Multi)',
  true
).run();
