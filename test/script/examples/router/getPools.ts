import { ApiPromise } from '@polkadot/api';
import { PolkadotExecutor } from '../../executor';
import { PolkadotPoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';

class GetAllAssetsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotPoolService(api);
    const router = new TradeRouter(poolService);
    return router.getPools();
  }
}

new GetAllAssetsExample('wss://rpc.basilisk.cloud', 'Get pools', true).run();
