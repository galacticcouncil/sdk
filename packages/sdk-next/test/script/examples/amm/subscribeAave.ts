import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { EvmClient } from '../../../../src/evm';
import { aave, PoolBase } from '../../../../src/pool';

class SubscribeAave extends PapiExecutor {
  async script(client: PolkadotClient, evm: EvmClient) {
    const { AavePoolClient } = aave;
    const aaveClient = new AavePoolClient(client, evm);

    const print = (pools: PoolBase[]) => {
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
