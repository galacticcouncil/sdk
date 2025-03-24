import { ApiPromise } from '@polkadot/api';
import { BalanceClient } from '../../../src';

import { PolkadotExecutor } from '../PjsExecutor';
import { ApiUrl } from '../types';

class GetOmnipoolBalance extends PolkadotExecutor {
  async script(api: ApiPromise) {
    const balanceClient = new BalanceClient(api);
    const observable = balanceClient.subscribeTokenBalanceRx(
      '7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1'
    );

    observable.subscribe((b) => b.forEach((e) => console.log(e)));
  }
}

new GetOmnipoolBalance(ApiUrl.HydraDx, 'Get omnipool balance').run();
