import { ApiPromise } from '@polkadot/api';
import { AssetClient } from '../../../src';

import { PolkadotExecutor } from '../PjsExecutor';
import { ApiUrl } from '../types';

import externalDegen from '../config/external.degen.json';
import external from '../config/external.degen.json';

class GetAssetsExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const assetClient = new AssetClient(api);
    return assetClient.getOnChainAssets(true, external);
  }
}

new GetAssetsExample(ApiUrl.HydraDx, 'Get all assets').run();
