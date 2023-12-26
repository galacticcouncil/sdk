import { ConfigService, ConfigBuilder } from '@moonbeam-network/xcm-config';
import { AssetAmount } from '@moonbeam-network/xcm-types';

import {
  chainsConfigMap,
  chainsMap,
  assetsMap,
} from '@galacticcouncil/xcm-cfg';
import { SubstrateApis, Wallet, XCall } from '@galacticcouncil/xcm-sdk';
import { logAssets, logSrcChains, logDestChains } from './utils';

// Inialialize config
const configService = new ConfigService({
  assets: assetsMap,
  chains: chainsMap,
  chainsConfig: chainsConfigMap,
});

// Inialialize wallet
const wallet: Wallet = new Wallet({
  configService: configService,
});

// Define transfer
const asset = configService.getAsset('hdx');
const srcChain = configService.getChain('moonbeam');
const destChain = configService.getChain('hydradx');

const configBuilder = ConfigBuilder(configService);
const { sourceChains } = configBuilder.assets().asset(asset);
const { destinationChains } = configBuilder
  .assets()
  .asset(asset)
  .source(srcChain);

// Dump transfer info
logAssets(srcChain);
logDestChains(asset.key, destinationChains);
logSrcChains(asset.key, sourceChains);

// Initialize bi-directional connection (optional)
const apiPool = SubstrateApis.getInstance();
console.time('connection');
const [_srcApi, _dstApi] = await Promise.all([
  apiPool.api(srcChain.ws),
  apiPool.api(destChain.ws),
]);
console.timeEnd('connection');

// Define source & dest accounts
const srcAddr = 'INSERT_ADDRESS';
const destAddr = 'INSERT_ADDRESS';

// Subscribe source chain token balance
const balanceObserver = (balances: AssetAmount[]) => console.log(balances);
const balanceSubscription = await wallet.subscribeBalance(
  srcAddr,
  srcChain,
  balanceObserver
);

// Get transfer input data (dialog)
const xdata = await wallet.transfer(
  asset,
  srcAddr,
  srcChain,
  destAddr,
  destChain
);

// Construct calldata with transfer amount
const call: XCall = xdata.buildCall('1');

// Dump transfer info
console.log(xdata);
console.log(call);

// Unsubscribe source chain balance
balanceSubscription.unsubscribe();
