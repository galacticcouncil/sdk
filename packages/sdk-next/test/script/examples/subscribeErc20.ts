import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { client as c } from '../../../src';

class SubscribeErc20 extends PapiExecutor {
  async script(client: PolkadotClient) {
    const balanceClient = new c.BalanceClient(client);
    const subscription = balanceClient
      .subscribeErc20Balance('7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1')
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

new SubscribeErc20(ApiUrl.Hydration, 'Subscribe erc20 balance').run();
