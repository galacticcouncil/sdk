import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

class GetTradeableAssets extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const tradeableAssets = await api.router.getTradeableAssets();
    console.log(tradeableAssets);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetTradeableAssets(ApiUrl.Hydration, 'Get tradeable assets').run();
