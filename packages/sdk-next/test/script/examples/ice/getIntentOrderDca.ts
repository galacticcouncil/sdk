import { Binary, PolkadotClient } from 'polkadot-api';

import { createSdkContext, json } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY, DAY_MS } from '../../const';
import { ApiUrl } from '../../types';

class GetIntentOrderDca extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api, client: cli, tx } = sdk;

    const pools = await api.router.getPools();

    const assetOut = pools
      .map((p) => p.tokens)
      .flat()
      .find((t) => t.id === 0);

    console.log(assetOut);

    const order = await api.scheduler.getDcaOrder(10, 0, '1000', DAY_MS);
    const intentTx = await tx
      .intentOrder(order)
      .withBeneficiary(BENEFICIARY)
      .withSlippage(1)
      .build();

    const intentCall = await intentTx.get().getEncodedData();
    console.log(order.toHuman());
    console.log('Tx name: ' + intentTx.name);
    console.log('Transaction hash: ' + Binary.toHex(intentCall));

    console.log(JSON.stringify(intentTx.get(), json.jsonFormatter, 2));

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

new GetIntentOrderDca(ApiUrl.Lark3, 'Get Intent DCA order').run();
