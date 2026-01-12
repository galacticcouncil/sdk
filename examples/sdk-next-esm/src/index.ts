import { createSdkContext } from '@galacticcouncil/sdk-next';
import { big } from '@galacticcouncil/common';

import { createClient } from 'polkadot-api';

import { getWsProvider, getSmProvider } from './clients';

const wsProvider = getWsProvider('wss://hydration-rpc.n.dwellir.com');

const client = createClient(wsProvider);

const sdk = await createSdkContext(client);

const { ctx } = sdk;

const pools = await ctx.pool.getPools();

console.log(pools);

setTimeout(() => {
  ctx.pool.destroy();
  console.log('Unsubscribed');
}, 60000);
