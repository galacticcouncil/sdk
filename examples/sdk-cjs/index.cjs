const { ApiPromise, WsProvider } = require('@polkadot/api');
const { TradeRouter, PoolService } = require('@galacticcouncil/sdk');

const main = async () => {
  // Initialize Polkadot API
  const wsProvider = new WsProvider('wss://rpc.hydradx.cloud');
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
