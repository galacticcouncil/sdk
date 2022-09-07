import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PolkadotPoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';

class GetAllAssetsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotPoolService(api);
    const router = new TradeRouter(poolService);
    return router.getPools();
  }
}

new GetAllAssetsExample(ApiUrl.Basilisk, 'Get pools', true).run();
