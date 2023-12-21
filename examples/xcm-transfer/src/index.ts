import { ConfigService, ConfigBuilder } from '@moonbeam-network/xcm-config';
import { AssetAmount } from '@moonbeam-network/xcm-types';

import {
  chainsConfigMap,
  chainsMap,
  assetsMap,
  evmChains,
} from '@galacticcouncil/xcm-cfg';
import {
  EvmResolver,
  SubstrateApis,
  Wallet,
  XCall,
} from '@galacticcouncil/xcm-sdk';

import { logAssets, logSrcChains, logDestChains } from './utils';

// Inialialize config
const configService = new ConfigService({
  assets: assetsMap,
  chains: chainsMap,
  chainsConfig: chainsConfigMap,
});

const acalaEvmResolver: EvmResolver = async (api: any, address: string) => {
  const h160Addr = await api.query.evmAccounts.evmAddresses(address);
  return h160Addr.toString();
};

// Inialialize wallet
const wallet: Wallet = new Wallet({
  configService: configService,
  evmChains: evmChains,
  evmResolvers: {
    acala: acalaEvmResolver,
  },
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
const apiPool = SubstrateApis.getInstance();
console.time('connection');
const [_srcApi, _dstApi] = await Promise.all([
  apiPool.api(srcChain.ws),
  apiPool.api(destChain.ws),
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
