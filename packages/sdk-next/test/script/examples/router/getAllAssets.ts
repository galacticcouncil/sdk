import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter } from '@galacticcouncil/sdk';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetAllAssetsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    return router.getAllAssets();
  }
}

new GetAllAssetsExample(ApiUrl.HydraDx, 'Get all assets').run();
