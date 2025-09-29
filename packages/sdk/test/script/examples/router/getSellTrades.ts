import { ApiPromise } from '@polkadot/api';
import { createSdkContext } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetSellTradesExample extends PolkadotExecutor {
  async script(apiPromise: ApiPromise): Promise<any> {
    const { api, tx } = createSdkContext(apiPromise);

    const trades = await api.router.getSellTrades('222', '22', '50');

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

    const [bestTrade] = trades;

    const bestTradeTx = await tx
      .trade(bestTrade)
      .withBeneficiary(BENEFICIARY)
      .build();
    console.log('Transaction hash: ' + bestTradeTx.hex);
    return bestTrade;
  }
}

new GetSellTradesExample(ApiUrl.Lark1, 'Get sell price', true).run();
