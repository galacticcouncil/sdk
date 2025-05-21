import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetAllPathsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const { tradeRouter } = createSdkContext(api);

    return tradeRouter.getAllPaths('0', '5');
  }
}

new GetAllPathsExample(ApiUrl.HydraDx, 'Get all paths').run();
