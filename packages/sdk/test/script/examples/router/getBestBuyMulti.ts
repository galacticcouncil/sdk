import { ApiPromise } from '@polkadot/api';
import {
  PoolService,
  PoolType,
  TradeRouter,
  TradeUtils,
} from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetBestBuyMultiExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const txUtils = new TradeUtils(api);

    const router = new TradeRouter(poolService, {
      includeOnly: [PoolType.Omni, PoolType.Stable],
    });

    const trade = await router.getBestBuy('0', '18', '10');
    const transaction = txUtils.buildBuyTx(trade);
    console.log('Transaction hash: ' + transaction.hex);
    return trade;
  }
}

new GetBestBuyMultiExample(
  ApiUrl.Nice,
  'Get best buy price (Multi)',
  true
).run();
