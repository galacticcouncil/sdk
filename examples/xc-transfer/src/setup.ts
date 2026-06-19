import { api, createSdkContext } from '@galacticcouncil/sdk-next';
import { createXcContext } from '@galacticcouncil/xc';
import { createClient } from 'polkadot-api';

const provider = api.getWs('wss://hydration-rpc.n.dwellir.com');
const client = createClient(provider);

export const sdk = await createSdkContext(client);
// Shared pool context
export const xc = await createXcContext({
  poolCtx: sdk.ctx.pool,
});

// Eager start
await sdk.ctx.pool.getPools();
