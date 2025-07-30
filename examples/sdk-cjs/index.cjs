const { ApiPromise, WsProvider } = require('@polkadot/api');
const { createSdkContext } = require('@galacticcouncil/sdk');

const ws = 'wss://hydration-rpc.n.dwellir.com';

const main = async () => {
  // Initialize Polkadot API
  const wsProvider = new WsProvider(ws, 2_500, {}, 60_000, 102400, 10 * 60_000);
  const apiPromise = await ApiPromise.create({ provider: wsProvider });

  const sdk = createSdkContext(apiPromise);

  const { api } = sdk;

  // Do something
  const result = await api.router.getAllAssets();
  console.log(result);
};

main()
  .then(() => console.log('Router call complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
