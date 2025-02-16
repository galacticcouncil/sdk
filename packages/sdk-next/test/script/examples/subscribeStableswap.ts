import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { pool } from '../../../src';

class SubscribeStableswap extends PapiExecutor {
  async script(client: PolkadotClient) {
    const { StableSwapClient } = pool.stable;
    const subscription = new StableSwapClient(client)
      .getSubscriber()
      .subscribe((pool) => {
        console.log(pool);
        this.logTime();
      });

    return () => {
      subscription.unsubscribe();
      client.destroy();
    };
  }
}

new SubscribeStableswap(ApiUrl.Hydration, 'Subscribe stableswap').run();
