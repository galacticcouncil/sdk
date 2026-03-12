import { PolkadotClient } from 'polkadot-api';

import { firstValueFrom } from 'rxjs';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { client as c } from '../../../src';

class GetOmnipoolBalance extends PapiExecutor {
  async script(client: PolkadotClient) {
    const balance = new c.BalanceClient(client);
    const observable = balance.watchBalance(
      '7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1'
    );
    return firstValueFrom(observable);
  }
}

new GetOmnipoolBalance(ApiUrl.Hydration, 'Get omnipool balance').run();
