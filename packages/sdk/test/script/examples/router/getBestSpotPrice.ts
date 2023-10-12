import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { PoolType } from '../../../../src/types';

class GetBestSpotPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService, { includeOnly: [PoolType.Omni, PoolType.Stable] });
    return router.getBestSpotPrice('5', '2');
  }
}

new GetBestSpotPriceExample(ApiUrl.HydraDx_Rococo, 'Get best spot price', true).run();
