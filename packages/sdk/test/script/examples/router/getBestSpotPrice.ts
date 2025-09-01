import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetBestSpotPriceExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api } = createSdkContext(apiPromise);
    return api.router.getBestSpotPrice('0', '10');
  }
}

new GetBestSpotPriceExample(
  ApiUrl.Hydration,
  'Get best spot price',
  true
).run();
