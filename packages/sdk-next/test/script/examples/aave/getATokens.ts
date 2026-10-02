import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

class GetATokens extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    const aTokens = await api.aave.getATokens();
    console.table(
      aTokens.map(({ aTokenId, underlyingId, market }) => ({
        aTokenId,
        underlyingId,
        pool: market.pool,
      }))
    );

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetATokens(ApiUrl.Hydration, 'Get aTokens of every market').run();
