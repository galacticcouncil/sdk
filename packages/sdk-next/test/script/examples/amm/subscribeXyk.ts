import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, evm } from '../../../../src';

import external from '../../config/external.json';

class SubscribeXyk extends PapiExecutor {
  async script(client: PolkadotClient, evm: evm.EvmClient) {
    const { XykPoolClient } = pool.xyk;
    const xykClient = new XykPoolClient(client, evm);

    const override = external.map((e) => {
      return { id: Number(e.internalId), decimals: e.decimals };
    });

    xykClient.withOverride(override);
    const subscription = xykClient.getSubscriber().subscribe((pool) => {
      console.log(pool);
      this.logTime();
    });

    return () => {
      subscription.unsubscribe();
      client.destroy();
    };
  }
}

new SubscribeXyk(ApiUrl.Hydration, 'Subscribe xyk').run();
