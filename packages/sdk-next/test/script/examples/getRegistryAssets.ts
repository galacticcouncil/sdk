import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { AssetClient } from '../../../src/client';

class GetAssetsExample extends PapiExecutor {
  async script(client: PolkadotClient): Promise<any> {
    const assetClient = new AssetClient(client);
    return assetClient.getSupported(false, []);
  }
}

new GetAssetsExample(ApiUrl.Hydration, 'Get all assets').run();
