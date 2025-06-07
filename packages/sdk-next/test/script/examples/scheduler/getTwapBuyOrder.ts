import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY, MAX_RETRIES } from '../../const';
import { ApiUrl } from '../../types';

class GetTwapOrder extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api, tx } = sdk;

    const order = await api.scheduler.getTwapBuyOrder(10, 0, '4000000');
    const orderTx = await tx
      .order(order)
      .withBeneficiary(BENEFICIARY)
      .withMaxRetries(MAX_RETRIES)
      .build();
    const orderCall = await orderTx.get().getEncodedData();
    console.log(order.toHuman());
    console.log('Transaction hash: ' + orderCall.asHex());

    const dryRun = await orderTx.dryRun(BENEFICIARY);
    if (dryRun.success) {
      const { execution_result } = dryRun.value;
      console.log('Transaction status: ' + execution_result.success);
    }

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetTwapOrder(ApiUrl.Hydration, 'Get Twap BUY order').run();
