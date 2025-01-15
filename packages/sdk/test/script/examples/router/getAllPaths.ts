import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter } from '@galacticcouncil/sdk';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetAllPathsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    return router.getAllPaths('0', '5');
  }
}

new GetAllPathsExample(ApiUrl.HydraDx, 'Get all paths').run();
