import { ApiPromise } from '@polkadot/api';

import { PoolService, TradeRouter, TradeUtils } from '../../../../src';

import { PolkadotExecutor } from '../../PjsExecutor';
import { ApiUrl } from '../../types';

const BENEFICIARY = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

class WithdrawAndSellExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const txUtils = new TradeUtils(api);

    const router = new TradeRouter(poolService);

    const trade = await router.getBestSell('69', '15', '0.1');
    const tx = txUtils.buildSellTx(trade);
    const txResult = await tx.dryRun(BENEFICIARY);

    const [firstSwap] = trade.swaps;
    if (txResult.executionResult.isErr && firstSwap.isWithdraw()) {
      console.log('Fallback to withdraw & reserve sell');
      const tx = await txUtils.buildWithdrawAndSellReserveTx(
        BENEFICIARY,
        trade
      );
      const txResult = await tx.dryRun(BENEFICIARY);
      console.log('Transaction hash: ' + tx.hex);
      console.log(txResult.toHuman());
      return trade;
    }

    console.log('Transaction hash: ' + tx.hex);
    console.log(txResult.toHuman());
    return trade;
  }
}

new WithdrawAndSellExample(
  ApiUrl.HydraDx,
  'Withdraw from market and sell',
  true
).run();
