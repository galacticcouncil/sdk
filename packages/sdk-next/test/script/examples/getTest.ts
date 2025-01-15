import { PolkadotClient } from 'polkadot-api';
import { hydration } from '@polkadot-api/descriptors';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

class GetFarmAprExample extends PapiExecutor {
  async script(client: PolkadotClient): Promise<any> {
    const chainSpec = await client.getChainSpecData();
    console.log(chainSpec);

    const api = client.getTypedApi(hydration);

    // const entries = await api.query.AssetRegistry.Assets.getEntries();
    // console.log(entries);

    const metadataV15 = await api.apis.Metadata.metadata_at_version(15, {
      at: 'best',
    });
    console.log(metadataV15);

    return null;
  }
}

new GetFarmAprExample(ApiUrl.HydraDx, 'Test').run();
