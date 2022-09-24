import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PolkadotApiPoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { ZERO } from '../../../../src/utils/bignumber';

class GetBestBuyPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotApiPoolService(api);
    const router = new TradeRouter(poolService);
    const bestBuy = await router.getBestBuy('1', '2', 10);
    const transaction = bestBuy.toTx(ZERO);
    console.log('Transaction hash: ' + transaction.hex);
    return bestBuy;
  }
}

new GetBestBuyPriceExample(ApiUrl.Basilisk, 'Get best buy price', true).run();
