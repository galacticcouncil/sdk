import { ApiPromise } from '@polkadot/api';
import { PolkadotExecutor } from '../../executor';
import { PolkadotPoolService } from '../../../../src/pool';
import { Router } from '../../../../src/api';

class GetAssetPairsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotPoolService(api);
    const router = new Router(poolService);
    return router.getAssetPairs('1');
  }
}

new GetAssetPairsExample('wss://rpc.basilisk.cloud', 'Get asset pairs').run();
