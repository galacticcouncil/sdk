import { ApiPromise } from '@polkadot/api';
import {
  PoolService,
  PoolType,
  TradeRouter,
  TradeUtils,
} from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';
class GetBestSellExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const external = [
      {
        decimals: 2,
        id: '420',
        name: 'BEEFY',
        origin: 1000,
        symbol: 'BEEFY',
        internalId: '1000036',
      },
    ];

    const poolService = new PoolService(api);
    const txUtils = new TradeUtils(api);

    await poolService.syncRegistry(external);

    const router = new TradeRouter(poolService, {
      includeOnly: [PoolType.Omni, PoolType.Stable, PoolType.XYK],
    });

    const trade = await router.getBestSell('5', '10', '1');
    const transaction = txUtils.buildSellTx(trade);
    console.log('Transaction hash: ' + transaction.hex);
    return trade;
  }
}

new GetBestSellExample(ApiUrl.HydraDx, 'Get best sell price', true).run();
