import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, evm } from '../../../../src';

class SubscribeStableswap extends PapiExecutor {
  async script(client: PolkadotClient, evm: evm.EvmClient) {
    const { StableSwapClient } = pool.stable;

    const stableClient = new StableSwapClient(client, evm);

    const print = (pools: pool.PoolBase[]) => {
      pools.forEach((pool) => {
        console.log(pool);
      });
      this.logTime();
    };

    const stableConsumer = stableClient.getSubscriber();
    const subscription = stableConsumer.subscribe(print);
    return () => {
      subscription.unsubscribe();
      client.destroy();
    };
  }
}

new SubscribeStableswap(ApiUrl.Hydration, 'Subscribe stableswap').run();
