import { Binary, PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetIntentOrderTwapSell extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api, tx } = sdk;

    const order = await api.scheduler.getTwapSellOrder(10, 0, '1000');
    const intentTx = await tx
      .intentOrder(order)
      .withBeneficiary(BENEFICIARY)
      .withSlippage(1)
      .build();

    const intentCall = await intentTx.get().getEncodedData();
    console.log(order.toHuman());
    console.log('Tx name: ' + intentTx.name);
    console.log('Transaction hash: ' + Binary.toHex(intentCall));

    try {
      const dryRun = await intentTx.dryRun(BENEFICIARY);
      if (dryRun.success) {
        const { execution_result } = dryRun.value;
        console.log('Transaction status: ' + execution_result.success);
      }
    } catch (e) {
      console.log(e);
    }

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetIntentOrderTwapSell(ApiUrl.Lark3, 'Get Intent TWAP SELL order').run();
