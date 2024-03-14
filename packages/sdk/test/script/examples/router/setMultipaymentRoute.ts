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
        api.query.multiTransactionPayment.acceptedCurrencies.keys().then(c => c.map(({ args: [currencyId] }) => currencyId.toString())),
        api.query.router.routes.entries().then(r => r.map(([{args: [{assetIn, assetOut}]}, route]) => ([[assetIn.toString(), assetOut.toString()], route]))
            .filter(([[asset_in]]) => asset_in.toString() === HDX)
            .reduce((a, [[,asset_out], route]) => ({...a, [asset_out]: route.toHuman()}), {}))
    ]);
    console.log(acceptedCurrencies, onchain);
    const {amountOut: hdxAmount} = await router.getBestSell('10', HDX, 2000);
    const routes = (await Promise.all(acceptedCurrencies.map(currencyId => router.getBestSell(HDX, currencyId, hdxAmount / 10 ** 12).catch(() => null))))
        .filter(i => i)
        .map(route => route.toTx(ZERO).get().toHuman().method)
        .filter(({section}) => section === 'router')
        .map(({args}) => args)
        .map(({asset_in, asset_out, route}) => api.tx.router.setRoute([asset_in, asset_out], route))
    console.log(routes.map(route => route.toHex()));
    return api.tx.utility.forceBatch(routes);
  }
}

new MultiCurrencyPaymentRoutes(
  ApiUrl.HydraDx,
  'Set MultiCurrencyPaymentRoutes on chain',
  true
).run();
