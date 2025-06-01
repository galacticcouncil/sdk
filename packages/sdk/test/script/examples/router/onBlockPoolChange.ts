import { ApiPromise } from '@polkadot/api';
import { PoolService, TradeRouter } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

import { appendFileSync } from 'fs';

class GetOnBlockPoolChangeExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);

    const header = await api.rpc.chain.getHeader();
    const line = '\nCurrent block number:' + header.number.toString();
    appendFileSync('./test.txt', line, 'utf8');

    await api.query.omnipool.assets.entries();

    api.rpc.chain.subscribeNewHeads(async (lastHeader) => {
      const block = lastHeader.number.toString();
      router.getPools().then((p) => {
        p.forEach((o) => {
          console.log('Pool: ' + o.address);
          o.tokens.forEach((t) => {
            console.log(t.id, ' => ', t.balance.toString());
          });

          const zero = o.tokens.find((t) => t.balance.toString() === '0');
          if (zero) {
            const line = '\n' + block + '\t' + o.address + '\t' + o.type;
            appendFileSync('./test.txt', line, 'utf8');
          }
        });
        console.log('===============', block, '===============');
      });
    });

    return [];
  }
}

new GetOnBlockPoolChangeExample(
  ApiUrl.HydraDx_Dwellir,
  'Get on block change',
  true
).run();
