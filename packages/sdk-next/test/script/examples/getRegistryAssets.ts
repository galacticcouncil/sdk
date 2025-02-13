import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import externalDegen from '../config/external.degen.json';
import external from '../config/external.json';

import { client as c } from '../../../src';

class GetAssetsExample extends PapiExecutor {
  async script(client: PolkadotClient): Promise<any> {
    const assetClient = new c.AssetClient(client);
    return assetClient.getOnChainAssets(false, []);
  }
}

new GetAssetsExample(ApiUrl.Hydration, 'Get all assets').run();
