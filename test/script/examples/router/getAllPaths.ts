import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PolkadotPoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';

class GetAllPathsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotPoolService(api);
    const router = new TradeRouter(poolService);
    return router.getAllPaths('1', '2');
  }
}

new GetAllPathsExample(ApiUrl.Basilisk, 'Get all paths').run();
