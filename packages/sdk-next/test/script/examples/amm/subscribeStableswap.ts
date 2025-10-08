import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, evm } from '../../../../src';

class SubscribeStableswap extends PapiExecutor {
  async script(client: PolkadotClient, evm: evm.EvmClient) {
    const { StableSwapClient } = pool.stable;
    const subscription = new StableSwapClient(client, evm)
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
