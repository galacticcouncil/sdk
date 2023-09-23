import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { PoolType } from '../../../../src/types';

class GetAssetPairsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService, { includeOnly: [PoolType.Omni] });
    return router.getAssetPairs('1');
  }
}

new GetAssetPairsExample(ApiUrl.HydraDx_Rococo, 'Get asset pairs').run();
