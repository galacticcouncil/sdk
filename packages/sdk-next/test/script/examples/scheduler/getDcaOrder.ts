import { PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY, DAY_MS, MAX_RETRIES } from '../../const';
import { ApiUrl } from '../../types';

class GetDcaOrder extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api, tx } = sdk;

    const order = await api.scheduler.getDcaOrder(10, 0, '5000', DAY_MS, 400);
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
      const { execution_result, emitted_events } = dryRun.value;
      console.log('Transaction status: ' + execution_result.success);
    }

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetDcaOrder(ApiUrl.Hydration, 'Get DCA order').run();
