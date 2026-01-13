import { api as papi, createSdkContext } from '@galacticcouncil/sdk-next';
import { big } from '@galacticcouncil/common';

import { createClient } from 'polkadot-api';

const wsProvider = papi.getWs('wss://hydration-rpc.n.dwellir.com', {
  onStatusChanged: (s) => {
    switch (s.type) {
      case 0:
        console.log('[WS] CONNECTING', s.uri);
        break;
      case 1:
        console.log('[WS] CONNECTED', s.uri);
        break;
      case 2:
        console.warn('[WS] CLOSED', s.event);
        break;
      case 3:
        console.error('[WS] ERROR', s);
        break;
    }
  },
});

const client = createClient(wsProvider);

const sdk = await createSdkContext(client);

const { ctx } = sdk;

const pools = await ctx.pool.getPools();

console.log(pools);

setTimeout(() => {
  ctx.pool.destroy();
  console.log('Unsubscribed');
}, 60000);
