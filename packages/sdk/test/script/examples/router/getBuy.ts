import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter, ZERO } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetBuyPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    const paths = await router.getAllPaths('1', '10');
    const sortByHopsDesc = paths.sort((a, b) => {
      const swapsA = a.length;
      const swapsB = b.length;
      return swapsA < swapsB ? 1 : -1;
    });
    const buy = await router.getBuy('1', '10', 10, sortByHopsDesc[0]);
    const transaction = buy.toTx(ZERO);
    console.log('Transaction hash: ' + transaction.hex);
    return buy;
  }
}

new GetBuyPriceExample(
  ApiUrl.HydraDx,
  'Get best buy price HydraDX',
  true
).run();
