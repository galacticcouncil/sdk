import { ApiPromise } from '@polkadot/api';
import { writeFileSync } from 'fs';

import { createSdkContext, Hop } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class PrintMostLiquidRoutes extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, client } = createSdkContext(apiPromise);

    const assets = await client.asset.getOnChainAssets();
    const sufficient = assets.filter((a) => a.isSufficient);
    const ids = sufficient.map((s) => s.id).filter((id) => id !== '20');

    const results = await Promise.allSettled(
      ids.map((id) => api.router.getMostLiquidRoute(id, '20'))
    );

    const hopsById = new Map<string, Hop[]>();

    results.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        const [init] = res.value;
        hopsById.set(init.assetIn, res.value);
      }
    });

    const obj = Object.fromEntries(hopsById);
    const json = JSON.stringify(obj, null, 2);

    writeFileSync('routes.json', json, 'utf8');
  }
}

new PrintMostLiquidRoutes(ApiUrl.Hydration, 'Print most liq routes').run();
