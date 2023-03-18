import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PolkadotApiPoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { PoolType } from '../../../../src/types';

class GetBestSpotPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotApiPoolService(api);
    const router = new TradeRouter(poolService, { includeOnly: [PoolType.XYK] });
    return router.getBestSpotPrice('1', '14');
  }
}

new GetBestSpotPriceExample(ApiUrl.Basilisk, 'Get best spot price', true).run();
