import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter, ZERO } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetBestBuyPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    const bestBuy = await router.getBestBuy('69', '690', '10');
    const transaction = bestBuy.toTx(ZERO);
    console.log('Transaction hash: ' + transaction.hex);
    return bestBuy;
  }
}

new GetBestBuyPriceExample(
  ApiUrl.HydraDx,
  'Get best buy price HydraDX',
  true
).run();
