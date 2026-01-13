import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { client as c } from '../../../src';

const G_POOL_ADDRESS = '7Ni2vDQ41AMCzx8pBpNvL3CtrkprAaAB73NzyJy6T17PaGHo';
const G_POOL_ERC20 = [1001];

class SubscribeErc20Balance extends PapiExecutor {
  async script(client: PolkadotClient) {
    const balanceClient = new c.BalanceClient(client);
    const subscription = balanceClient
      .watchErc20Balance(G_POOL_ADDRESS, G_POOL_ERC20)
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

new SubscribeErc20Balance(ApiUrl.Hydration, 'Subscribe erc20 balance').run();
