import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter } from '@galacticcouncil/sdk';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetAssetPairsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    return router.getAssetPairs('1');
  }
}

new GetAssetPairsExample(ApiUrl.Nice, 'Get asset pairs').run();
