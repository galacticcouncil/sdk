import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, evm } from '../../../../src';

class SubscribeOmnipool extends PapiExecutor {
  async script(client: PolkadotClient, evm: evm.EvmClient) {
    const { OmniPoolClient } = pool.omni;
    const subscription = new OmniPoolClient(client, evm)
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

new SubscribeOmnipool(ApiUrl.Hydration, 'Subscribe omnipool').run();
