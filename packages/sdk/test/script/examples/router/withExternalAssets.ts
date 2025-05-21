import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

import externalDegen from '../../config/external.degen.json';
import external from '../../config/external.degen.json';

class GetAllAssetsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const { poolService, tradeRouter } = createSdkContext(api);

    await poolService.syncRegistry(externalDegen);
    return tradeRouter.getAllAssets();
  }
}

new GetAllAssetsExample(
  ApiUrl.HydraDx,
  'Get all assets (external included)',
  true
).run();
