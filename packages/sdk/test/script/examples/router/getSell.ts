import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetSellExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, tx } = createSdkContext(apiPromise);

    const paths = await api.router.getAllPaths('0', '5');
    const sortByHopsDesc = paths.sort((a, b) => {
      const swapsA = a.length;
      const swapsB = b.length;
      return swapsA < swapsB ? 1 : -1;
    });

    const trade = await api.router.getSell('0', '5', '1', sortByHopsDesc[0]);
    const tradeTx = await tx.trade(trade).withBeneficiary(BENEFICIARY).build();
    console.log('Transaction hash: ' + tradeTx.hex);
    return trade;
  }
}

new GetSellExample(ApiUrl.HydraDx, 'Get sell price', true).run();
