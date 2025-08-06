import { ApiPromise } from '@polkadot/api';
import { createSdkContext, PoolType } from '../../../../src';
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
  {
    decimals: 10,
    id: '23',
    internalId: '1000021',
    name: 'PINK',
    origin: 1000,
    symbol: 'PINK',
  },
  {
    decimals: 10,
    id: '30',
    internalId: '1000019',
    name: 'DED',
    origin: 1000,
    symbol: 'DED',
  },
];

class GetBestSellExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, ctx, tx } = createSdkContext(apiPromise);

    await ctx.pool.syncRegistry(external);
    const trade = await api.router.getBestSell('1002', '222', '1');
    const tradeTx = await tx.trade(trade).withBeneficiary(BENEFICIARY).build();
    console.log('Transaction hash: ' + tradeTx.hex);

    const { executionResult } = await tradeTx.dryRun(BENEFICIARY);
    console.log('Transaction status: ' + executionResult.isOk);
    return trade;
  }
}

new GetBestSellExample(ApiUrl.Lark1, 'Get best sell price', true).run();
