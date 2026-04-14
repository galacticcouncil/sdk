import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { EvmClient } from '../../../../src/evm';
import { xyk, PoolBase } from '../../../../src/pool';

import external from '../../config/external.json';

class SubscribeXyk extends PapiExecutor {
  async script(client: PolkadotClient, evm: EvmClient) {
    const { XykPoolClient } = xyk;

    const override = external.map((e) => {
      return { id: Number(e.internalId), decimals: e.decimals };
    });

    const xykClient = new XykPoolClient(client, evm);

    // xykClient.withOverride(override);

    const print = (pools: PoolBase[]) => {
      pools.forEach((pool) => {
        console.log(pool);
      });
      this.logTime();
    };

    const xykConsumer = xykClient.getSubscriber();
    const subscription = xykConsumer.subscribe(print);
    return () => {
      subscription.unsubscribe();
      client.destroy();
    };
  }
}

new SubscribeXyk(ApiUrl.Hydration, 'Subscribe xyk').run();
