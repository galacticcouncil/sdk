import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

import externalDegen from '../../config/external.degen.json';
import external from '../../config/external.degen.json';

class GetAllAssetsExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, ctx } = createSdkContext(apiPromise);

    await ctx.pool.syncRegistry(externalDegen);
    return api.router.getAllAssets();
  }
}

new GetAllAssetsExample(
  ApiUrl.HydraDx,
  'Get all assets (external included)',
  true
).run();
