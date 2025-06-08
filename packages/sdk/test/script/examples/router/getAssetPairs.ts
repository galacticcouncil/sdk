import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetAssetPairsExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api } = createSdkContext(apiPromise);

    return api.router.getAssetPairs('1');
  }
}

new GetAssetPairsExample(ApiUrl.Nice, 'Get asset pairs').run();
