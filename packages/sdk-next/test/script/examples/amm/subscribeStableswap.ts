import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { EvmClient } from '../../../../src/evm';
import { stable, PoolBase } from '../../../../src/pool';

class SubscribeStableswap extends PapiExecutor {
  async script(client: PolkadotClient, evm: EvmClient) {
    const { StableSwapClient } = stable;

    const stableClient = new StableSwapClient(client, evm);

    const print = (pools: PoolBase[]) => {
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
