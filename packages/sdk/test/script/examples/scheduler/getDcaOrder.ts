import { ApiPromise } from '@polkadot/api';

import {
  CachingPoolService,
  TradeRouter,
  TradeScheduler,
} from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

const BENEFICIARY = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';

const DAY_PERIOD = 24 * 60 * 60 * 1000;

class GetDcaOrder extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new CachingPoolService(api);
    const router = new TradeRouter(poolService);
    const scheduler = new TradeScheduler(api, router);

    const dca = await scheduler.getDcaOrder('10', '0', '60', DAY_PERIOD);
    const transaction = scheduler.txUtils.buildDcaTx(BENEFICIARY, dca);
    console.log('Transaction hash: ' + transaction.hex);

    const res = await transaction.dryRun(BENEFICIARY);
    console.log(res.toHuman());

    return dca.toHuman();
  }
}

new GetDcaOrder(ApiUrl.HydraDx, 'Get DCA order').run();
