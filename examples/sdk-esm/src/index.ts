import { TradeRouter, PoolService } from '@galacticcouncil/sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';

const wsProvider = new WsProvider('wss://rpc.hydradx.cloud');
const api = await ApiPromise.create({ provider: wsProvider });

// Initialize Trade Router
const poolService = new PoolService(api);
const tradeRouter = new TradeRouter(poolService);

// Do something
const result = await tradeRouter.getAllAssets();
console.log(result);
api.disconnect();
