import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, evm } from '../../../../src';

class SubscribeAave extends PapiExecutor {
  async script(client: PolkadotClient, evm: evm.EvmClient) {
    const { AavePoolClient } = pool.aave;

    const aaveClient = new AavePoolClient(client, evm);

    const print = (pools: pool.PoolBase[]) => {
      pools.forEach((pool) => {
        console.log(pool);
      });
      this.logTime();
    };

    const aaveConsumer = aaveClient.getSubscriber();
    const subscription = aaveConsumer.subscribe(print);
    return () => {
      subscription.unsubscribe();
      client.destroy();
    };
  }
}

new SubscribeAave(ApiUrl.Hydration, 'Subscribe aave').run();
