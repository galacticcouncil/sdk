import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetAllAssetsExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api } = createSdkContext(apiPromise);

    return api.router.getAllAssets();
  }
}

new GetAllAssetsExample(ApiUrl.Hydration, 'Get all assets').run();
