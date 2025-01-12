import { TradeRouter, PoolService } from '@galacticcouncil/sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';

import { degen } from './external';

const wsProvider = new WsProvider('wss://rpc.hydradx.cloud');
const api = await ApiPromise.create({ provider: wsProvider });

// Initialize Trade Router
const poolService = new PoolService(api);
const tradeRouter = new TradeRouter(poolService);

await poolService.syncRegistry(degen);

// Do something
const result = await tradeRouter.getAllAssets();
console.log(result);

setTimeout(() => {
  poolService.unsubscribe();
  console.log('Unsubscribed');
}, 60000);
