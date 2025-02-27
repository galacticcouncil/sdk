const { api, pool } = require('@galacticcouncil/sdk-next');

const main = async () => {
  const client = await api.getWs('wss://rpc.hydradx.cloud');

  await client.getUnsafeApi().constants.System.Version();

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
