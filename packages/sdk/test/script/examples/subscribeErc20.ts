import { ApiPromise } from '@polkadot/api';
import { BalanceClient, toDecimals } from '../../../src';

import { PolkadotExecutor } from '../PjsExecutor';
import { BENEFICIARY } from '../const';
import { ApiUrl } from '../types';

class SubscribeErc20Example extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const balance = new BalanceClient(api);

    balance.subscribeErc20Balance(
      '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh',
      (balances) => {
        balances.forEach(([id, val]) => {
          if (id === '1001') {
            console.log(id, '=>', toDecimals(val, 10));
          }
        });
      }
    );
  }
}

new SubscribeErc20Example(ApiUrl.Hydration, 'Get Subscribe Erc20').run();
