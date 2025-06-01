import { TradeRouter, PoolService } from '@galacticcouncil/sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';

import { degen } from './external';

const ws = 'wss://hydration-rpc.n.dwellir.com';

const wsProvider = new WsProvider(
  ws,
  2_500, // autoConnect (2.5 seconds)
  {}, // headers
  60_000, // request timeout  (60 seconds)
  102400, // cache capacity
  10 * 60_000 // cache TTL (10 minutes)
);

const api = await ApiPromise.create({ provider: wsProvider });

// Initialize Trade Router
const poolService = new PoolService(api);
const tradeRouter = new TradeRouter(poolService);

await poolService.syncRegistry(degen);

// Do something
const result = await tradeRouter.getAllAssets();
console.log(result);

setTimeout(() => {
  poolService.destroy();
  console.log('Unsubscribed');
}, 60000);
