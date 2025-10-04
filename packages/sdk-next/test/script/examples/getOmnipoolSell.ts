import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { pool, evm } from '../../../src';

class GetOmnipoolSell extends PapiExecutor {
  async script(client: PolkadotClient, evm: evm.EvmClient) {
    const { OmniPoolClient, OmniPool } = pool.omni;

    const omniPoolClient = new OmniPoolClient(client, evm);
    const [omnipool] = await omniPoolClient.getPools();

    const omniPool = OmniPool.fromPool(omnipool);
    const pair = omniPool.parsePair(5, 0);

    return omniPool.calculateOutGivenIn(pair, 10_000_000_000n);
  }
}

new GetOmnipoolSell(ApiUrl.Hydration, 'Get omnipool sell').run();
