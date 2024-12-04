import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter, WalletCtx } from '../../../../src/api';
import { HYDRADX_OMNIPOOL_ADDRESS } from '../../../../src/consts';

class GetOnBlockPoolChangeExample extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    const walletCtx = new WalletCtx(api);

    const result = await Promise.all([
      router.getBestSpotPrice('5', '0'),
      router.getBestSpotPrice('5', '0'),
      router.getBestSpotPrice('5', '0'),
      router.getBestSpotPrice('5', '0'),
      router.getBestSpotPrice('5', '0'),
    ]);
    console.log('Call spot 5x simultaneously', result);

    api.rpc.chain.subscribeNewHeads(async (lastHeader) => {
      const block = lastHeader.number.toString();
      console.log('===============', block, '===============');
      router.getPools().then((p) => {
        p.forEach((o) => {
          o.tokens.forEach((t) => {
            if (t.id === '1') {
              // Checking LRNA balance change
              console.log(t.id, t.balance.toString());
            }
          });
        });
      });

      const balance = await walletCtx.getBalancesMem(HYDRADX_OMNIPOOL_ADDRESS);
      console.log('balance', balance);
    });

    return [];
  }
}

new GetOnBlockPoolChangeExample(
  ApiUrl.HydraDx,
  'Get on block change',
  true
).run();
