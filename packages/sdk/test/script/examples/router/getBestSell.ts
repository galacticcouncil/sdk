import { ApiPromise } from '@polkadot/api';
import {
  CachingPoolService,
  createSdkContext,
  PoolType,
  TradeRouter,
  TradeUtils,
} from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

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

class GetBestSellExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const { poolService, tradeRouter } = createSdkContext(api);

    await poolService.syncRegistry(external);

    const trade = await tradeRouter.getBestSell('5', '10', '10');
    const tradeTx = trade.toTx();
    console.log('Transaction hash: ' + tradeTx.hex);
    return trade;
  }
}

new GetBestSellExample(ApiUrl.HydraDx, 'Get best sell price', true).run();
