import { api as papi, pool } from '@galacticcouncil/sdk-next';

const client = await papi.getWs('wss://hydradx-rpc.dwellir.com');

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
