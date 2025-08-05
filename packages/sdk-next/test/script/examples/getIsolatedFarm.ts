import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { client as c } from '../../../src';

class GetisolatedFarm extends PapiExecutor {
  async script(client: PolkadotClient) {
    const liquidityMiningClient = new c.LiquidityMining(client);

    const isolatedFarm = await liquidityMiningClient.getIsolatedFarms(
      '15L6BQ1sMd9pESapK13dHaXBPPtBYnDnKTVhb2gBeGrrJNBx'
    );

    return isolatedFarm;
  }
}

new GetisolatedFarm(ApiUrl.Hydration, 'Get isolated farm').run();
