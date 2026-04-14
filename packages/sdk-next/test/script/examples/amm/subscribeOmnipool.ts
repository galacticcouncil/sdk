import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { EvmClient } from '../../../../src/evm';
import { omni, PoolBase } from '../../../../src/pool';

class SubscribeOmnipool extends PapiExecutor {
  async script(client: PolkadotClient, evm: EvmClient) {
    const { OmniPoolClient } = omni;

    const omniClient = new OmniPoolClient(client, evm);

    const print = (pools: PoolBase[]) => {
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
