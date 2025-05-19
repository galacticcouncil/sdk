import { ApiPromise } from '@polkadot/api';
import {
  CachingPoolService,
  TradeRouter,
  TradeScheduler,
} from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

const BENEFICIARY = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';

class GetTwapOrder extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new CachingPoolService(api);
    const router = new TradeRouter(poolService);
    const scheduler = new TradeScheduler(api, router);

    const twap = await scheduler.getTwapSellOrder('10', '0', '50000');
    const transaction = scheduler.txUtils.buildTwapSellTx(BENEFICIARY, twap);
    console.log('Transaction hash: ' + transaction.hex);

    const res = await transaction.dryRun(BENEFICIARY);
    console.log(res.toHuman());

    return twap.toHuman();
  }
}

new GetTwapOrder(ApiUrl.HydraDx, 'Get Twap order').run();
