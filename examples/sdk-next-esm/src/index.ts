import { api, pool } from '@galacticcouncil/sdk-next';

const client = await api.getWs('wss://rpc.hydradx.cloud');

await client.getUnsafeApi().constants.System.Version();

const ctx = new pool.PoolContextProvider(client)
  .withOmnipool()
  .withStableswap()
  .withXyk();

const pools = await ctx.getPools();

console.log(pools);

setTimeout(() => {
  ctx.destroy();
  console.log('Unsubscribed');
}, 60000);
