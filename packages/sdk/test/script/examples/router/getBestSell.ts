import { ApiPromise } from '@polkadot/api';
import { PoolService, PoolType, TradeRouter, ZERO } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';
class GetBestSellPriceExample extends PolkadotExecutor {
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
    await poolService.syncRegistry(external);
    const router = new TradeRouter(poolService, {
      includeOnly: [PoolType.Stable],
    });
    //const bestSell = await router.getBestSell('15', '1000037', '1');
    //const bestSell = await router.getBestSell('1', '10', '1');

    const bestSell = await router.getBestSell('15', '1000037', '10');

    const transaction = bestSell.toTx(ZERO);
    console.log('Transaction hash: ' + transaction.hex);
    return bestSell;
  }
}

new GetBestSellPriceExample(ApiUrl.Nice, 'Get best sell price', true).run();
