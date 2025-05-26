import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetBestBuyExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, tx } = createSdkContext(apiPromise);

    const trade = await api.router.getBestBuy('69', '690', '10');
    const tradeTx = await tx.buildTradeTx(trade, BENEFICIARY);
    console.log('Transaction hash: ' + tradeTx.hex);
    return trade;
  }
}

new GetBestBuyExample(ApiUrl.HydraDx, 'Get best buy price HydraDX', true).run();
