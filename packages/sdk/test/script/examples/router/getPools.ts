import { ApiPromise } from '@polkadot/api';
import { createSdkContext, PoolType } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetPoolsExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api } = createSdkContext(apiPromise, {
      router: { exclude: [PoolType.HSM] },
    });

    const pools = await api.router.getPools();
    const list = pools.filter(
      (p) => p.type === PoolType.Stable && p.id === '690'
    );
    console.log(JSON.stringify(list, null, 2));
  }
}

new GetPoolsExample(ApiUrl.Hydration, 'Get pools', true).run();
