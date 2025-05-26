import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetOnBlockPoolChangeExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, ctx } = createSdkContext(apiPromise);

    await Promise.all([
      api.router.getPools(),
      api.router.getPools(),
      api.router.getPools(),
      api.router.getPools(),
      api.router.getPools(),
      api.router.getPools(),
    ]);

    apiPromise.rpc.chain.subscribeNewHeads(async (lastHeader) => {
      const block = lastHeader.number.toString();
      console.log('===============', block, '===============');
      api.router.getPools().then((p) => {
        p.forEach((o) => {
          o.tokens.forEach((t) => {
            if (t.id === '1') {
              // Checking LRNA balance change
              console.log(t.id, t.balance.toString());
            }
          });
        });
      });
    });

    setTimeout(() => {
      console.log('Sync reg 1 ');
      ctx.pool.syncRegistry();
    }, 45 * 1000);

    setTimeout(() => {
      console.log('Sync reg 2');
      ctx.pool.syncRegistry();
    }, 90 * 1000);

    return [];
  }
}

new GetOnBlockPoolChangeExample(
  ApiUrl.HydraDx,
  'Get on block change',
  true
).run();
