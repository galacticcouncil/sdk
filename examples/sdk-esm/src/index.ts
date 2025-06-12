import { createSdkContext, PoolType } from '@galacticcouncil/sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';

const ws = 'wss://hydration-rpc.n.dwellir.com';

const wsProvider = new WsProvider(ws, 2_500, {}, 60_000, 102400, 10 * 60_000);
const apiPromise = await ApiPromise.create({ provider: wsProvider });

const sdk = createSdkContext(apiPromise);

const { api } = sdk;

const pools = await api.router.getPools();
console.log(pools.filter((p) => p.type === PoolType.Stable));

setTimeout(() => {
  sdk.destroy();
  apiPromise.disconnect();
  console.log('Unsubscribed');
}, 60000);
