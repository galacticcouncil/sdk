import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetDollarPriceExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, client, ctx } = createSdkContext(apiPromise);

    const assets = await client.asset.getOnChainAssets();
    console.log('Assets', assets.map((a) => a.id).sort());

    await api.router.getPools();

    apiPromise.rpc.chain.subscribeNewHeads(async (lastHeader) => {
      const block = lastHeader.number.toString();
      const start = performance.now();
      // console.log(block);
      const prices = await Promise.all(
        assets.map(async (asset) => [
          asset.id,
          await api.router.getBestSpotPrice(asset.id, '10'),
        ])
      );
      console.log('spot:', performance.now() - start);
    });
  }
}

new GetDollarPriceExample(ApiUrl.Hydration, 'Get best spot price', true).run();
