import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';
import { humanizeError } from '../../../../src/utils/error';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

const external = [
  {
    decimals: 2,
    id: '420',
    name: 'BEEFY',
    origin: 1000,
    symbol: 'BEEFY',
    internalId: '1000036',
  },
];

class GetBestSellExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, ctx, tx } = createSdkContext(apiPromise);

    await ctx.pool.syncRegistry(external);

    const trade = await api.router.getBestSell('1005', '15', '61.1');
    const tradeTx = await tx.trade(trade).withBeneficiary(BENEFICIARY).build();
    console.log('Transaction hash: ' + tradeTx.hex);

    const { executionResult } = await tradeTx.dryRun(BENEFICIARY);
    console.log('Transaction status: ' + executionResult.isOk);
    return trade;
  }
}

new GetBestSellExample(ApiUrl.HydraDx, 'Get best sell price', true).run();
