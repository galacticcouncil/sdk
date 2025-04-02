import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetOnBlockPoolChangeExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);

    await Promise.all([
      router.getPools(),
      router.getPools(),
      router.getPools(),
      router.getPools(),
      router.getPools(),
      router.getPools(),
    ]);

    api.rpc.chain.subscribeNewHeads(async (lastHeader) => {
      const block = lastHeader.number.toString();
      console.log('===============', block, '===============');
      router.getPools().then((p) => {
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
      poolService.syncRegistry();
    }, 45 * 1000);

    setTimeout(() => {
      console.log('Sync reg 2');
      poolService.syncRegistry();
    }, 90 * 1000);

    return [];
  }
}

new GetOnBlockPoolChangeExample(
  ApiUrl.HydraDx,
  'Get on block change',
  true
).run();
