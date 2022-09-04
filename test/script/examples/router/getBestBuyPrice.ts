import { ApiPromise } from '@polkadot/api';
import { PolkadotExecutor } from '../../executor';
import { PolkadotPoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { bnum, scale } from '../../../../src/utils/bignumber';

class GetBestBuyPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotPoolService(api);
    const router = new TradeRouter(poolService);
    return router.getBestBuyPrice('1', '2', scale(bnum('10'), 12));
  }
}

new GetBestBuyPriceExample(
  'wss://rpc.basilisk.cloud',
  'Get best buy price',
  true
).run();
