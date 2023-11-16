import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { ZERO } from '../../../../src/utils/bignumber';

class GetBestBuyPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    const bestBuy = await router.getBestBuy('1', '2', 10);
    const transaction = bestBuy.toTx(ZERO);
    console.log('Transaction hash: ' + transaction.hex);
    return bestBuy;
  }
}

new GetBestBuyPriceExample(
  ApiUrl.HydraDx_Rococo,
  'Get best buy price',
  true
).run();
