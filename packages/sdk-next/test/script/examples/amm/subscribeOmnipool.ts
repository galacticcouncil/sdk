import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, evm, json } from '../../../../src';

class SubscribeOmnipool extends PapiExecutor {
  async script(client: PolkadotClient, evm: evm.EvmClient) {
    const { OmniPoolClient } = pool.omni;

    const omniClient = new OmniPoolClient(client, evm);

    const print = (pools: pool.PoolBase[]) => {
      pools.forEach((pool) => {
        console.log(pool);
      });
      this.logTime();
    };

    const omniConsumer = omniClient.getSubscriber();
    const subscription = omniConsumer.subscribe(print);
    return () => {
      subscription.unsubscribe();
      client.destroy();
    };
  }
}

new SubscribeOmnipool(ApiUrl.Hydration, 'Subscribe omnipool').run();
