import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetBestSell extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api, tx } = sdk;

    const trade = await api.router.getBestSell(5, 10, 10_000_000_000n);
    const tradeTx = await tx.buildTradeTx(trade, BENEFICIARY);
    const tradeCall = await tradeTx.get().getEncodedData();
    console.log(trade.toHuman());
    console.log('Transaction hash: ' + tradeCall);

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetBestSell(ApiUrl.Hydration, 'Get best sell').run();
