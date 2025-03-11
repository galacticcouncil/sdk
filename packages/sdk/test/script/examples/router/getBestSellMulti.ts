import { ApiPromise } from '@polkadot/api';
import { PoolService, PoolType, TradeRouter, ZERO } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetBestSellPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService, {
      includeOnly: [PoolType.Omni, PoolType.Stable],
    });
    const bestSell = await router.getBestSell('0', '18', '10');
    const transaction = bestSell.toTx(ZERO);
    console.log('Transaction hash: ' + transaction.hex);
    return bestSell;
  }
}

new GetBestSellPriceExample(
  ApiUrl.HydraDx,
  'Get best sell price (Multi)',
  true
).run();
