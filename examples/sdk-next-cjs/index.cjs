const {
  api: { getWs },
  createSdkContext,
} = require('@galacticcouncil/sdk-next');
const { createXcContext } = require('@galacticcouncil/xc');
const { createClient } = require('polkadot-api');

const main = async () => {
  const provider = getWs('wss://hydration-rpc.n.dwellir.com');
  const client = createClient(provider);

  const sdk = await createSdkContext(client);
  const xc = await createXcContext(sdk.ctx.pool);

  const { ctx } = sdk;
  const { config } = xc;

  const pools = await ctx.pool.getPools();
  console.log(pools);
};

main()
  .then(() => console.log('Sdk call complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
