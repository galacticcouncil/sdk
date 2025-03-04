import { api as papi, pool } from '@galacticcouncil/sdk-next';

const client = await papi.getWs('wss://rpc.hydradx.cloud');
const api = client.getUnsafeApi();

await api.constants.System.Version(); // Removal is fatal

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
