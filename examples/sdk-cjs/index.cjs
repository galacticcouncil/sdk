const { ApiPromise, WsProvider } = require('@polkadot/api');
const { TradeRouter, PoolService } = require('@galacticcouncil/sdk');

const ws = 'wss://hydration-rpc.n.dwellir.com';

const main = async () => {
  // Initialize Polkadot API
  const wsProvider = new WsProvider(
    ws,
    2_500, // autoConnect (2.5 seconds)
    {}, // headers
    60_000, // request timeout  (60 seconds)
    102400, // cache capacity
    10 * 60_000 // cache TTL (10 minutes)
  );

  const wsProvide = new WsProvider('', 2_500, {}, 60_000, 102400, 10 * 60_000);

  const api = await ApiPromise.create({ provider: wsProvider });

  // Initialize Trade Router
  const poolService = new PoolService(api);
  const tradeRouter = new TradeRouter(poolService);

  // Do something
  const result = await tradeRouter.getAllAssets();
  console.log(result);
};

main()
  .then(() => console.log('Router call complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
