import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';

import externalDegen from '../../config/external.degen.json';
import external from '../../config/external.degen.json';

class GetAllAssetsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    await poolService.syncRegistry(externalDegen);
    return router.getAllAssets();
  }
}

new GetAllAssetsExample(
  ApiUrl.HydraDx,
  'Get all assets (external included)',
  true
).run();
