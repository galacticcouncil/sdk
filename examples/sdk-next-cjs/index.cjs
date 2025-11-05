const {
  api: { getWs },
  createSdkContext,
} = require('@galacticcouncil/sdk-next');

const main = async () => {
  const client = await getWs('wss://hydradx-rpc.dwellir.com');
  const sdk = await createSdkContext(client);

  const { ctx } = sdk;

  const pools = await ctx.pool.getPools();

  console.log(pools);
};

main()
  .then(() => console.log('Sdk call complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
