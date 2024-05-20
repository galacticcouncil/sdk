import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../executor';
import { FarmClient } from '../../../src/client/FarmClient';

class GetFarmAprExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const farmClient = new FarmClient(api);

    const omnipool = await farmClient.getFarmApr('5', 'omnipool');
    const isolatedpool = await farmClient.getFarmApr(
      '7JjS5KRKRGDvK9vHx6a1g1zEP81mDoisVPMabnECUPnCfMd8',
      'isolatedpool'
    );
    return { omnipool, isolatedpool };
  }
}

new GetFarmAprExample(ApiUrl.Nice, 'Get farm apr').run();
