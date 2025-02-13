import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { api as a, pool as p } from '../../../../src';

class GetBestSellPriceExample extends PapiExecutor {
  async script(client: PolkadotClient): Promise<any> {
    const poolService = new p.PoolService(client);
    const router = new a.TradeRouter(poolService);

    //const bestSell = await router.getBestSell(5, 0, 10_000_000_000n);
    const bestSell = await router.getBestSell(1, 10, 1_000_000_000_000n);

    //const transaction = bestSell.toTx(ZERO);
    //console.log('Transaction hash: ' + transaction.hex);
    return bestSell;
  }
}

new GetBestSellPriceExample(ApiUrl.HydraDx, 'Get best sell price', true).run();
