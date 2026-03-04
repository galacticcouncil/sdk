import { PolkadotClient } from 'polkadot-api';

import { createSdkContext, json } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetBestSell extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api, tx, ctx } = sdk;

    ctx.pool.withHsm();

    const trade = await api.router.getBestBuy(222, 1003, '3');
    const tradeTx = await tx.trade(trade).withBeneficiary(BENEFICIARY).build();
    const tradeCall = await tradeTx.get().getEncodedData();
    console.log(trade.toHuman());
    console.log('Transaction hash: ' + tradeCall.asHex());

    try {
      const result = await tradeTx.dryRun(BENEFICIARY);
      console.log(result);
    } catch (e) {
      console.log(e);
    }

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetBestSell(ApiUrl.Hydration, 'Get best sell').run();
