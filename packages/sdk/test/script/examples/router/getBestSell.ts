import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { ZERO } from '../../../../src/utils/bignumber';

class GetBestSellPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const external = [
      {
        decimals: 2,
        id: '420',
        name: 'BEEFY',
        origin: 1000,
        symbol: 'BEEFY',
      },
    ];

    const poolService = new PoolService(api);
    await poolService.syncRegistry(external);
    const router = new TradeRouter(poolService);
    const bestSell = await router.getBestSell('5', '0', 1);
    const transaction = bestSell.toTx(ZERO);
    console.log('Transaction hash: ' + transaction.hex);
    return bestSell;
  }
}

new GetBestSellPriceExample(ApiUrl.HydraDx, 'Get best sell price', true).run();
