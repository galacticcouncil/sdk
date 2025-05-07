import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, sor } from '../../../../src';

class GetBestSell extends PapiExecutor {
  async script(client: PolkadotClient) {
    const ctx = new pool.PoolContextProvider(client)
      .withOmnipool()
      .withStableswap()
      .withXyk();

    const router = new sor.TradeRouter(ctx);
    const utils = new sor.TradeUtils(client);

    const sell = await router.getBestSell(5, 10, 10_000_000_000n);
    const tx = await utils.buildSellTx(sell);
    console.log(sell.toHuman());
    console.log('Transaction hash: ' + tx.asHex());

    return () => {
      ctx.destroy();
      client.destroy();
    };
  }
}

new GetBestSell(ApiUrl.Hydration, 'Get best sell').run();
