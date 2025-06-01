import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

const external = [
  {
    decimals: 10,
    id: '30',
    name: 'DED',
    origin: 1000,
    symbol: 'DED',
    internalId: '1000019',
  },
  {
    decimals: 10,
    id: '23',
    name: 'PINK',
    origin: 1000,
    symbol: 'PINK',
    internalId: '1000021',
  },
  {
    decimals: 2,
    id: '420',
    name: 'BEEFY',
    origin: 1000,
    symbol: 'BEEFY',
    internalId: '1000036',
  },
];

class GetBestSpotPriceExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, ctx } = createSdkContext(apiPromise);

    await ctx.pool.syncRegistry(external);
    return api.router.getBestSpotPrice('5', '0');
  }
}

new GetBestSpotPriceExample(ApiUrl.HydraDx, 'Get best spot price', true).run();
