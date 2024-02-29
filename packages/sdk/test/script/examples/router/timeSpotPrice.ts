import {ApiPromise} from '@polkadot/api';
import {ApiUrl, PolkadotExecutor} from '../../executor';
import {PoolService} from '../../../../src/pool';
import {TradeRouter} from '../../../../src/api';
import {PoolType} from '../../../../src/types';

class GetBestSpotPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    console.time('init router')
    console.log('init router')
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService, { includeOnly: [PoolType.Omni, PoolType.Stable, PoolType.LBP] });
    console.timeEnd('init router')
    let result;
    console.time('spot price 10x')
    for (let i = 0; i < 10; i++) {
      console.log('get best spot price ', i, 'of 10')
      console.time(`time of spot price`)
      result = await router.getBestSpotPrice('5', '2');
      console.timeEnd(`time of spot price`)
    }
    console.timeEnd('spot price 10x')
    return result;
  }
}

new GetBestSpotPriceExample(ApiUrl.HydraDx, 'Get best spot price', true).run();
