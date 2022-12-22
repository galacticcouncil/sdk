import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PolkadotApiPoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { PoolType } from '../../../../src/types';

class GetAssetPairsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotApiPoolService(api);
    const router = new TradeRouter(poolService, { includeOnly: [PoolType.XYK] });
    return router.getAssetPairs('1');
  }
}

new GetAssetPairsExample(ApiUrl.Basilisk, 'Get asset pairs').run();
