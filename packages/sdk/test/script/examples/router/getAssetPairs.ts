import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetAssetPairsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const { tradeRouter } = createSdkContext(api);

    return tradeRouter.getAssetPairs('1');
  }
}

new GetAssetPairsExample(ApiUrl.Nice, 'Get asset pairs').run();
