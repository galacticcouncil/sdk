import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetBestBuy extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api, tx } = sdk;

    const trade = await api.router.getBestBuy(10, 5, 100_000_000_000n);
    const tradeTx = await tx.trade(trade).withBeneficiary(BENEFICIARY).build();
    const tradeCall = await tradeTx.get().getEncodedData();
    console.log(trade.toHuman());
    console.log('Transaction hash: ' + tradeCall.asHex());

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetBestBuy(ApiUrl.Hydration, 'Get best buy').run();
