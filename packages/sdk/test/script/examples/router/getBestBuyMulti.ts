import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { ZERO } from '../../../../src/utils/bignumber';
import { PoolType } from '../../../../src/types';

class GetBestBuyPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService, {
      includeOnly: [PoolType.Omni, PoolType.Stable],
    });
    const bestBuy = await router.getBestBuy('0', '18', '10');
    const transaction = bestBuy.toTx(ZERO);
    console.log('Transaction hash: ' + transaction.hex);
    return bestBuy;
  }
}

new GetBestBuyPriceExample(
  ApiUrl.Nice,
  'Get best buy price (Multi)',
  true
).run();
