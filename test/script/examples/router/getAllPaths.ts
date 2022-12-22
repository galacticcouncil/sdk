import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PolkadotApiPoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { PoolType } from '../../../../src/types';

class GetAllPathsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotApiPoolService(api);
    const router = new TradeRouter(poolService, { includeOnly: [PoolType.XYK] });
    return router.getAllPaths('1', '2');
  }
}

new GetAllPathsExample(ApiUrl.Basilisk, 'Get all paths').run();
