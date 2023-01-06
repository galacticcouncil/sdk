import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PolkadotApiPoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { ZERO } from '../../../../src/utils/bignumber';
import { PoolType } from '../../../../src/types';

class GetBestSellPriceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PolkadotApiPoolService(api);
    const router = new TradeRouter(poolService, { includeOnly: [PoolType.Omni] });

    const a = api.tx.xTokens.transfer.meta.args[3].type.toString();

    const useNewDestWeight = api.tx.xTokens.transfer.meta.args;

    console.log(a + ' : ' + useNewDestWeight);

    const bestSell = await router.getBestSell('2', '5', '1');
    const transaction = bestSell.toTx(ZERO);
    console.log('Transaction hash: ' + transaction.hex);
    return bestSell;
  }
}

new GetBestSellPriceExample(ApiUrl.Hydra_Rococo, 'Get best sell price (Omni)', true).run();
