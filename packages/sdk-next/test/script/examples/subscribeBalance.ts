import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { client as c } from '../../../src';

const TRSRY_ADDRESS = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';

class SubscribeBalance extends PapiExecutor {
  async script(client: PolkadotClient) {
    const balanceClient = new c.BalanceClient(client);
    const subscription = balanceClient
      .watchBalance(TRSRY_ADDRESS)
      .subscribe((balances) => {
        console.log(balances);
        this.logTime();
      });

    return () => {
      subscription.unsubscribe();
      client.destroy();
    };
  }
}

new SubscribeBalance(ApiUrl.Hydration, 'Subscribe balance').run();
