import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { ZERO } from '../../../../src/utils/bignumber';

class GetSellPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    const paths = await router.getAllPaths('0', '5');
    const sortByHopsDesc = paths.sort((a, b) => {
      const swapsA = a.length;
      const swapsB = b.length;
      return swapsA < swapsB ? 1 : -1;
    });
    const sell = await router.getSell('0', '5', 1, sortByHopsDesc[0]);
    const transaction = sell.toTx(ZERO);
    console.log('Transaction hash: ' + transaction.hex);
    return sell;
  }
}

new GetSellPriceExample(ApiUrl.HydraDx, 'Get sell price', true).run();
