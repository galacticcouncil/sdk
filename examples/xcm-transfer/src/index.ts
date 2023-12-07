import { ConfigService, ConfigBuilder } from '@moonbeam-network/xcm-config';
import { AssetAmount } from '@moonbeam-network/xcm-types';
import { getPolkadotApi } from '@moonbeam-network/xcm-utils';

import {
  chainsConfigMap,
  chainsMap,
  assetsMap,
  evmChains,
} from '../../../packages/xcm-cfg/build/types';
import { Wallet, XCall } from '@galacticcouncil/xcm-sdk';

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
  evmChains: evmChains,
});

// Define transfer
const asset = configService.getAsset('hdx');
const srcChain = configService.getChain('hydradx');
const destChain = configService.getChain('moonbeam');

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
console.time('connection');
const [_srcApi, _dstApi] = await Promise.all([
  getPolkadotApi(srcChain.ws),
  getPolkadotApi(destChain.ws),
]);
console.timeEnd('connection');

// Define source & dest accounts
const srcAddr = 'INSERT_ACCOUNT';
const destAddr = 'INSERT_ACCOUNT';

// Subscribe source chain token balance
const balanceObserver = (balance: AssetAmount) => console.log(balance);
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
const call: XCall = xdata.transfer('1');

// Dump transfer info
console.log(xdata);
console.log(call);

// Unsubscribe source chain balance
balanceSubscription.unsubscribe();
