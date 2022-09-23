import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PolkadotPoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { ONE, ZERO } from '../../../../src/utils/bignumber';

class ExecuteBestSellExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotPoolService(api);
    const router = new TradeRouter(poolService);
    const bestSell = await router.getBestSell('4', '5', 1);
    bestSell.execute(ZERO);
    return bestSell;
  }
}

new ExecuteBestSellExample(ApiUrl.Basilisk_Rococo, 'Execute best sell', true).run();
