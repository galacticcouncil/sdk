import { ApiPromise } from '@polkadot/api';

import {
  CachingPoolService,
  TradeRouter,
  TradeScheduler,
  TradeUtils,
} from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

const BENEFICIARY = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';

const DAY_PERIOD = 24 * 60 * 60 * 1000;
const MAX_RETRIES = 3;

class GetDcaOrder extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new CachingPoolService(api);

    const utils = new TradeUtils(api);
    const router = new TradeRouter(poolService, utils);
    const scheduler = new TradeScheduler(router);

    const order = await scheduler.getDcaOrder('10', '0', '10', DAY_PERIOD);
    const orderTx = order.toTx(BENEFICIARY, MAX_RETRIES);

    console.log('Transaction hash: ' + orderTx.hex);

    const result = await orderTx.dryRun(BENEFICIARY);
    console.log(result.toHuman());

    return order.toHuman();
  }
}

new GetDcaOrder(ApiUrl.HydraDx, 'Get DCA order').run();
