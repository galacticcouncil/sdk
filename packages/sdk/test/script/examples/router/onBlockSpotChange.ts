import { ApiPromise } from '@polkadot/api';
import { createSdkContext, toDecimals } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

class GetOnBlockSpotChangeExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api } = createSdkContext(apiPromise);

    apiPromise.rpc.chain.subscribeNewHeads(async (lastHeader) => {
      const block = lastHeader.number.toString();
      const spot = await api.router.getBestSpotPrice('0', '10');
      if (spot) {
        const spotFmt = toDecimals(spot.amount, spot.decimals);

        const time = [
          '-----',
          new Date().toISOString().replace('T', ' ').replace('Z', ''),
          '-----',
        ].join('');

        console.log(block, time, '=>', spotFmt);
      }
    });
  }
}

new GetOnBlockSpotChangeExample(
  ApiUrl.Hydration,
  'Get on block change',
  true
).run();
