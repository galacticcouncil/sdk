import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, evm } from '../../../../src';

class SubscribeAave extends PapiExecutor {
  async script(client: PolkadotClient, evm: evm.EvmClient) {
    const { AavePoolClient } = pool.aave;
    const subscription = new AavePoolClient(client, evm)
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

new SubscribeAave(ApiUrl.Hydration, 'Subscribe aave').run();
