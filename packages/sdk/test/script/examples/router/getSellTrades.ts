import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetSellTradesExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, tx } = createSdkContext(apiPromise);

    const trades = await api.router.getSellTrades('10', '5', '1');

    console.log('No of routes: ' + trades.length);
    const table = trades.map((t) => {
      const { amountOut } = t.toHuman();
      const from = t.swaps[0].assetIn;
      const via = t.swaps.map(
        (swap) => ' <-' + swap.pool.substring(0, 1) + '-> ' + swap.assetOut
      );
      via.unshift(from);

      return {
        Route: via.join(''),
        'Amount Out': amountOut,
      };
    });
    console.table(table);

    const [trade] = trades;
    const tradeTx = await tx.trade(trade).withBeneficiary(BENEFICIARY).build();
    console.log('Transaction hash: ' + tradeTx.hex);
    return trade;
  }
}

new GetSellTradesExample(ApiUrl.Hydration, 'Get sell price', true).run();
