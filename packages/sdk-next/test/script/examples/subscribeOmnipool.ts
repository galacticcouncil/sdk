import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { pool as p } from '../../../src';

class SubscribeOmnipool extends PapiExecutor {
  async script(client: PolkadotClient) {
    const { OmniPoolClient, OmniPool } = p.omni;
    return new OmniPoolClient(client)
      .getSubscriber()
      .subscribe(([omnipool]) => {
        const pool = OmniPool.fromPool(omnipool);
        const pair = pool.parsePair(5, 0);
        const sell = pool.calculateOutGivenIn(pair, 10_000_000_000n);
        console.log(sell);
      });
  }
}

new SubscribeOmnipool(ApiUrl.Hydration, 'Subscribe omnipool').run();
