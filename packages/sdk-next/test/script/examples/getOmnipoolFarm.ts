import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { client as c } from '../../../src';

class GetOmnipoolFarm extends PapiExecutor {
  async script(client: PolkadotClient) {
    const liquidityMiningClient = new c.LiquidityMining(client);

    const omnipoolFarm = await liquidityMiningClient.getOmnipoolFarms('5');

    return omnipoolFarm;
  }
}

new GetOmnipoolFarm(ApiUrl.Hydration, 'Get omnipool farm').run();
