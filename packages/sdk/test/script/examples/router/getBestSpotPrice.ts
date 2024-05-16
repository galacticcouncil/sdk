import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';

class GetBestSpotPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const external = [
      {
        decimals: 10,
        id: '30',
        name: 'DED',
        origin: 1000,
        symbol: 'DED',
      },
      {
        decimals: 10,
        id: '23',
        name: 'PINK',
        origin: 1000,
        symbol: 'PINK',
      },
      {
        decimals: 2,
        id: '420',
        name: 'BEEFY',
        origin: 1000,
        symbol: 'BEEFY',
      },
    ];

    const poolService = new PoolService(api);
    await poolService.syncRegistry(external);
    const router = new TradeRouter(poolService);
    return router.getBestSpotPrice('1000036', '5');
  }
}

new GetBestSpotPriceExample(ApiUrl.HydraDx, 'Get best spot price', true).run();
