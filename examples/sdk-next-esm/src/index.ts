import { api as papi, createSdkContext } from '@galacticcouncil/sdk-next';

const client = await papi.getWs('wss://hydradx-rpc.dwellir.com');

const sdk = await createSdkContext(client);
const { ctx } = sdk;

const pools = await ctx.pool.getPools();
console.log(pools);

setTimeout(() => {
  ctx.pool.destroy();
  console.log('Unsubscribed');
}, 60000);
