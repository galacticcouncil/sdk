import { PolkadotClient } from 'polkadot-api';

import { firstValueFrom } from 'rxjs';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { BalanceClient } from '../../../src/client';

class GetOmnipoolBalance extends PapiExecutor {
  async script(client: PolkadotClient) {
    const balance = new BalanceClient(client);
    const observable = balance.watchBalance(
      '7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1'
    );
    return firstValueFrom(observable);
  }
}

new GetOmnipoolBalance(ApiUrl.Hydration, 'Get omnipool balance').run();
