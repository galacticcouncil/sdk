import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

import { pool as p } from '../../../src';

type OmniPoolBase = p.omni.OmniPoolBase;

class GetXyk extends PapiExecutor {
  async script(client: PolkadotClient): Promise<any> {
    const { OmniPoolClient, OmniPool } = p.omni;

    const omniClient = new OmniPoolClient(client);
    const pools = await omniClient.loadPools();

    const omniBase = pools[0] as OmniPoolBase;
    const omniPool = OmniPool.fromPool(omniBase!);
    const omniPair = omniPool.parsePair(5, 0);

    return omniPool.calculateOutGivenIn(omniPair, 10_000_000_000n);
  }
}

new GetXyk(ApiUrl.HydraDx, 'Get xyk pools').run();
