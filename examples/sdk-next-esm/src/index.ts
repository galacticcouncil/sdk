import { api as papi, createSdkContext } from '@galacticcouncil/sdk-next';
import { createClient } from 'polkadot-api';

const provider = papi.getWs('wss://hydration-rpc.n.dwellir.com');
const client = createClient(provider);

const sdk = await createSdkContext(client);
const { ctx } = sdk;

const pools = await ctx.pool.getPools();
console.log(pools);

setTimeout(() => {
  ctx.pool.destroy();
  console.log('Unsubscribed');
}, 60000);
