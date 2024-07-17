import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';

class GetAllAssetsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const external = [
      {
        decimals: 8,
        origin: 1000,
        id: '666',
        name: 'Danger Coin',
        symbol: 'DANGER',
        internalId: '1000008',
        isWhiteListed: true,
      },
    ];

    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    await poolService.syncRegistry(external);
    return router.getAllAssets();
  }
}

new GetAllAssetsExample(
  ApiUrl.Nice,
  'Get all assets (external included)',
  true
).run();
