import { ApiPromise } from '@polkadot/api';
import { BalanceClient } from '../../../src';

import { PolkadotExecutor } from '../PjsExecutor';
import { ApiUrl } from '../types';

import externalDegen from '../config/external.degen.json';
import external from '../config/external.degen.json';

class SubscribeBalanceExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const balanceClient = new BalanceClient(api);
    balanceClient.subscribeTokensBalance(
      '7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1',
      () => {
        const time = [
          '-----',
          new Date().toISOString().replace('T', ' ').replace('Z', ''),
          '-----',
        ].join('');
        console.log(time);
      }
    );
  }
}

new SubscribeBalanceExample(ApiUrl.HydraDx, 'Subscribe balance').run();
