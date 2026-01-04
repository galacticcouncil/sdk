import { ApiPromise } from '@polkadot/api';

import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class PrintMostLiquidRoute extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api } = createSdkContext(apiPromise);

    const mlr = await api.router.getMostLiquidRoute('690', '10');
    console.log(mlr);
  }
}

new PrintMostLiquidRoute(ApiUrl.Hydration, 'Print most liq route').run();
