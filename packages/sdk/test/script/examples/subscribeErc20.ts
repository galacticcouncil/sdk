import { ApiPromise } from '@polkadot/api';
import { BalanceClient } from '../../../src';

import { PolkadotExecutor } from '../PjsExecutor';
import { BENEFICIARY } from '../const';
import { ApiUrl } from '../types';

class SubscribeErc20Example extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const balance = new BalanceClient(api);

    balance.subscribeErc20Balance(BENEFICIARY, (balances) => {
      balances.forEach(([id, val]) => {
        console.log(id, '=>', val.toString());
      });
    });
  }
}

new SubscribeErc20Example(ApiUrl.HydraDx_Dwellir, 'Get Subscribe Erc20').run();
