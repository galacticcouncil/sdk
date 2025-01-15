import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter } from '@galacticcouncil/sdk';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetPoolsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    return router.getPools();
  }
}

new GetPoolsExample(ApiUrl.HydraDx, 'Get pools', true).run();
