import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { ZERO } from '../../../../src/utils/bignumber';
import { PoolType } from '../../../../src/types';

class GetBestSellPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService, { includeOnly: [PoolType.Omni] });
    const bestSell = await router.getBestSell('1', '14', 1);
    const transaction = bestSell.toTx(ZERO);
    console.log('Transaction hash: ' + transaction.hex);
    return bestSell;
  }
}

new GetBestSellPriceExample(ApiUrl.HydraDx_Rococo, 'Get best sell price', true).run();
