import { Binary, PolkadotClient } from 'polkadot-api';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetIntentLimit extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api, tx } = sdk;

    const trade = await api.router.getBestSell(10, 0, 1000_000_000n);
    const intentTx = await tx
      .intentLimit(trade)
      .withBeneficiary(BENEFICIARY)
      .withMinAmountOut(trade.amountOut)
      .withPartial(false)
      .build();

    const intentCall = await intentTx.get().getEncodedData();
    console.log(trade.toHuman());
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

new GetIntentLimit(ApiUrl.Lark3, 'Get Intent limit order').run();
