import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { pool, evm, json } from '../../../../src';

class SubscribeOmnipool extends PapiExecutor {
  async script(client: PolkadotClient, evm: evm.EvmClient) {
    const { OmniPoolClient } = pool.omni;

    const omniClient = new OmniPoolClient(client, evm);

    const pools = await omniClient.getMemPools();
    omniClient.subscribeBalances2(pools).subscribe((pool) => {
      console.log(pool);
      this.logTime();
    });

    /*     const subscription = new OmniPoolClient(client, evm)
      .getSubscriber()
      .subscribe((pool) => {
        console.log(pool);
        this.logTime();
      }); */

    return () => {
      /*       subscription.unsubscribe();
      client.destroy(); */
    };
  }
}

new SubscribeOmnipool(ApiUrl.Hydration, 'Subscribe omnipool').run();
