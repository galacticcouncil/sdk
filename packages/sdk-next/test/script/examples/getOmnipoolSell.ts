import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { pool as p } from '../../../src';

class GetOmnipoolSell extends PapiExecutor {
  async script(client: PolkadotClient) {
    const { OmniPoolClient, OmniPool } = p.omni;

    const omniPoolClient = new OmniPoolClient(client);
    const [omnipool] = await omniPoolClient.getPools();

    const pool = OmniPool.fromPool(omnipool);
    const pair = pool.parsePair(5, 0);

    return pool.calculateOutGivenIn(pair, 10_000_000_000n);
  }
}

new GetOmnipoolSell(ApiUrl.Hydration, 'Get omnipool sell').run();
