import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter, TradeUtils } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetBestBuyExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const txUtils = new TradeUtils(api);

    const router = new TradeRouter(poolService);

    const trade = await router.getBestBuy('69', '690', '10');
    const transaction = txUtils.buildBuyTx(trade);
    console.log('Transaction hash: ' + transaction.hex);
    return trade;
  }
}

new GetBestBuyExample(ApiUrl.HydraDx, 'Get best buy price HydraDX', true).run();
