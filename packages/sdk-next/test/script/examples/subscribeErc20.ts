import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { client as c } from '../../../src';

class SubscribeErc20 extends PapiExecutor {
  async script(client: PolkadotClient) {
    const balanceClient = new c.BalanceClient(client);
    const gigaPoolAddr = '7Ni2vDQ41AMCzx8pBpNvL3CtrkprAaAB73NzyJy6T17PaGHo';
    const subscription = balanceClient
      .subscribeErc20Balance(gigaPoolAddr, [1001])
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

new SubscribeErc20(ApiUrl.Hydration, 'Subscribe erc20 balance').run();
