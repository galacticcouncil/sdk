import {
  HydrationWhitelistEntry,
  HubWhitelistEntry,
  WhitelistEntriesByChain,
} from '../.papi/descriptors';

const hydrationWhitelist: HydrationWhitelistEntry[] = [
  'api.AaveTradeExecutor.*',
  'api.CurrenciesApi.*',
  'api.EthereumRuntimeRPCApi.*',

  'const.Aura.*',
  'const.DCA.*',
  'const.DynamicFees.*',
  'const.HSM.*',
  'const.LBP.*',
  'const.Omnipool.*',
  'const.Stableswap.*',
  'const.XYK.*',
  'const.Staking.*',
  'event.EVM.Log',
  'event.Router.Executed',
  'query.AssetRegistry.*',
  'query.Bonds.*',
  'query.DynamicFees.*',
  'query.EmaOracle.*',
  'query.Ethereum.*',
  'query.HSM.*',
  'query.LBP.*',
  'query.MultiTransactionPayment.*',
  'query.Omnipool.*',
  'query.OmnipoolWarehouseLM.*',
  'query.ParachainSystem.ValidationData',
  'query.Referenda.*',
  'query.Tokens.*',
  'query.Stableswap.*',
  'query.Staking.*',
  'query.Uniques.Account',
  'query.XYK.*',
  'query.XYKWarehouseLM.*',
  'tx.DCA.*',
  'tx.Dispatcher.*',
  'tx.Omnipool.*',
  'tx.Router.*',
];

const hubWhitelist: HubWhitelistEntry[] = [
  'query.ForeignAssets.*',
  'query.Assets.*',
  'api.AssetConversionApi.*',
  'tx.Assets.*',
];

export const whitelist: WhitelistEntriesByChain = {
  '*': [
    'api.DryRunApi.*',
    'api.XcmPaymentApi.*',
    'const.System.*',
    'query.System.*',
    'tx.PolkadotXcm.*',
  ],
  hydration: hydrationWhitelist,
  hub: hubWhitelist,
};
