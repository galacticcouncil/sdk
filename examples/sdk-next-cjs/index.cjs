const {
  api: { getWs },
  pool,
} = require('@galacticcouncil/sdk-next');

const main = async () => {
  const client = await getWs('wss://rpc.hydradx.cloud');
  const api = client.getUnsafeApi();

  await api.constants.System.Version(); // Removal is fatal

  const ctx = new pool.PoolContextProvider(client)
    .withOmnipool()
    .withStableswap()
    .withXyk();

  const pools = await ctx.getPools();

  console.log(pools);
};

main()
  .then(() => console.log('Sdk call complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
