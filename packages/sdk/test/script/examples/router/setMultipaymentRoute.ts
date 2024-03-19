import { ApiPromise } from '@polkadot/api';
import { ApiUrl, PolkadotExecutor } from '../../executor';
import { PoolService } from '../../../../src/pool';
import { TradeRouter } from '../../../../src/api';
import { ZERO } from '../../../../src/utils/bignumber';

const HDX = '0';

class MultiCurrencyPaymentRoutes extends PolkadotExecutor {
  async script(api: ApiPromise): Promise<any> {
    const poolService = new PoolService(api);
    const router = new TradeRouter(poolService);
    const [acceptedCurrencies, onchain] = await Promise.all([
      api.query.multiTransactionPayment.acceptedCurrencies
        .keys()
        .then((c) => c.map(({ args: [currencyId] }) => currencyId.toString())),
      api.query.router.routes.entries().then((r) =>
        r
          .map(
            ([
              {
                args: [{ assetIn, assetOut }],
              },
              route,
            ]) => [[assetIn.toString(), assetOut.toString()], route]
          )
          .filter(([[asset_in, asset_out]]) => asset_in === HDX || asset_out === HDX)
          .map(
            ([[asset_in, asset_out], route]) => ({
              assets: [asset_in, asset_out],
              route: route.toHuman(),
            }))
      ),
    ]);
    const { amountOut: hdxAmount } = await router.getBestSell('10', HDX, 2000);
    const routes = (
      await Promise.all(
        acceptedCurrencies.map((currencyId) =>
          router
            .getBestSell(HDX, currencyId, hdxAmount / 10 ** 12)
            .catch(() => null)
        )
      )
    )
      .filter((i) => i)
      .map((route) => route.toTx(ZERO).get().toHuman().method)
      .filter(({ section }) => section === 'router')
      .filter(({ asset_in, asset_out }) => [asset_in, asset_out].sort() )
      .map(({ args }) => args)
      .filter(({ asset_in, asset_out }) => !onchain.find(({ assets: [a, b] }) => (a === asset_in && b === asset_out) || (a === asset_out && b === asset_in)))
      .map(({ asset_in, asset_out, route }) =>
        api.tx.router.setRoute([asset_in, asset_out], route)
      );
    console.log(routes.map((route) => route.toHex()));
    return api.tx.utility.forceBatch(routes);
  }
}

new MultiCurrencyPaymentRoutes(
  ApiUrl.HydraDx,
  'Set MultiCurrencyPaymentRoutes on chain',
  true
).run();
