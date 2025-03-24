import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter, PoolType } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetPoolsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService, {
      includeOnly: [PoolType.Omni],
    });
    return router.getPools();
  }
}

new GetPoolsExample(ApiUrl.HydraDx, 'Get pools', true).run();
