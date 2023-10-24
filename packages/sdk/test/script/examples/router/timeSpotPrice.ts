import {ApiPromise} from '@polkadot/api';
import {ApiUrl, PolkadotExecutor} from '../../executor';
import {PoolService} from '../../../../src/pool';
import {TradeRouter} from '../../../../src/api';
import {PoolType} from '../../../../src/types';

class GetBestSpotPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService, { includeOnly: [PoolType.Omni, PoolType.Stable] });
    let result;
    console.time('Get best spot price with LBP 10x')
    for (let i = 0; i < 10; i++) {
      result = await router.getBestSpotPrice('5', '2');
    }
    console.timeEnd('Get best spot price with LBP 10x')
    return result;
  }
}

new GetBestSpotPriceExample(ApiUrl.HydraDx, 'Get best spot price', true).run();
