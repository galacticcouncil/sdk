import { ApiPromise } from '@polkadot/api';
import { FarmClient } from '@galacticcouncil/sdk';

import { PolkadotExecutor } from '../PjsExecutor';
import { ApiUrl } from '../types';

class GetFarmAprExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const farmClient = new FarmClient(api);

    const omnipool = await farmClient.getFarmApr('5', 'omnipool');
    const isolatedpool = await farmClient.getFarmApr(
      '7MveTu8GZxFc5953NYU85MGx6xti1KtaCiPyM6C9p9Ka2gnD',
      'isolatedpool'
    );
    return { omnipool, isolatedpool };
  }
}

new GetFarmAprExample(ApiUrl.HydraDx, 'Get farm apr').run();
