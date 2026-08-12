import {
  AnyChain,
  AnyParachain,
  Asset,
  AssetRoute,
  ExtrinsicConfigBuilderParams,
  Parachain,
} from '@galacticcouncil/xc-core';

import { dot, glmr, usdt, weth_wh } from '../../../assets';
import {
  ContractBuilder,
  ExtrinsicBuilder,
  ExtrinsicDecorator,
  FeeAmountBuilder,
  XcmTransferType,
} from '../../../builders';
import { assetHub, kusamaAssetHub } from '../../../chains';
import { Tag } from '../../../tags';

import { fee } from './configs';

export const GLMR_MIN_DEST_FEE = 1; // Minimum GLMR fee to meet swap threshold
export const HUB_EXT_USDT_DEST_FEE = 0.02;

const isDestinationFeeSwapSupported = (
  params: ExtrinsicConfigBuilderParams
) => {
  const { source } = params;
  const { enabled } = source.destinationFeeSwap || {};
  return !!enabled;
};

const swapExtrinsicBuilder = ExtrinsicBuilder().router().buy({ slippage: 30 });

export function toTransferTemplate(
  asset: Asset,
  destination: AnyChain,
  reserve?: AnyParachain
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: fee(),
    },
    destination: {
      chain: destination,
      asset: asset,
      fee: {
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee(reserve ? { reserve } : undefined),
        asset: asset,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  });
}

export function toParaTemplate(
  asset: Asset,
  destination: AnyChain,
  feeAmount: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: fee(),
    },
    destination: {
      chain: destination,
      asset: asset,
      fee: {
        amount: feeAmount,
        asset: asset,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  });
}

export function toHubTemplate(asset: Asset, hub: Parachain): AssetRoute {
  return new AssetRoute({
    source: {
      asset,
      fee: fee(),
    },
    destination: {
      chain: hub,
      asset,
      fee: {
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
        asset,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    }),
  });
}

export function toHubExtTemplate(asset: Asset): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: fee(),
    },
    destination: {
      chain: assetHub,
      asset: asset,
      fee: {
        amount: HUB_EXT_USDT_DEST_FEE,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).prior(ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets()),
  });
}

// Direct route to Kusama AssetHub via the Polkadot<>Kusama bridge - first hop
// to the sibling AssetHub gateway, bridge crossing executed in custom XCM
// (single signature). `executionFee` funds BuyExecution on the peer AssetHub.
export function toKusamaHubTemplate(
  asset: Asset,
  destFee: number,
  executionFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset,
      fee: fee(),
    },
    destination: {
      chain: kusamaAssetHub,
      asset,
      fee: {
        amount: destFee,
        asset,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
      executionFee,
    }),
  });
}

export function toParaErc20Template(
  asset: Asset,
  destination: AnyParachain,
  transferType: XcmTransferType = XcmTransferType.LocalReserve
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: fee(),
    },
    destination: {
      chain: destination,
      asset: asset,
      fee: {
        amount: GLMR_MIN_DEST_FEE,
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).prior(
      ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
        transferType,
      })
    ),
  });
}

/**
 * Both signer origins are served, and the route declares a config for each:
 * an ss58 signer takes the `extrinsic` (evm calls wrapped in `EVM.call`, one
 * signature, fee quoted by the runtime in the sender's fee currency), an h160
 * signer takes the `contract` and signs plain evm transactions.
 */
export function viaNttTemplate(
  assetIn: Asset,
  assetOut: Asset,
  to: AnyChain
): AssetRoute {
  const transfer = ContractBuilder().Wormhole().Ntt().transfer();
  return new AssetRoute({
    source: {
      asset: assetIn,
      fee: fee(),
    },
    destination: {
      chain: to,
      asset: assetOut,
      fee: {
        amount: 0,
        asset: assetIn,
      },
    },
    contract: transfer,
    extrinsic: ExtrinsicBuilder().evm().call(transfer),
    tags: [Tag.Wormhole, Tag.Ntt],
  });
}

/**
 * Executor-delivered variant, offered alongside the self-redeem route above
 * for the same pair - the sender pays for delivery instead of signing a
 * redeem on the destination.
 *
 * Cost is charged in weth, hydration's evm native gas - `EVM.call { value }`
 * debits the weth balance (asset 20), not hdx - whether the transfer is signed
 * as h160 or wrapped in EVM.call. Ntt still delivers the full amount.
 *
 * Must stay an 18 decimal asset: the builder returns a raw evm value, and hdx
 * would both name the wrong balance and resolve to 12 decimals.
 *
 * A sender holding no weth buys it first: the same destination fee swap the
 * xcm routes use, batched ahead of the calls. Only an ss58 origin needs it -
 * that one pays its extrinsic fee in hdx and can hold zero weth, and is the
 * origin whose config is an extrinsic in the first place. An h160 has nothing
 * to batch into, but pays its own gas in weth, so it already holds some.
 */
export function viaNttExecutorTemplate(
  assetIn: Asset,
  assetOut: Asset,
  to: AnyChain
): AssetRoute {
  const transfer = ContractBuilder().Wormhole().Ntt().transferViaExecutor();
  return new AssetRoute({
    source: {
      asset: assetIn,
      fee: fee(),
    },
    destination: {
      chain: to,
      asset: assetOut,
      fee: {
        amount: FeeAmountBuilder().Wormhole().quoteExecutorCost(),
        asset: weth_wh,
      },
    },
    contract: transfer,
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).prior(ExtrinsicBuilder().evm().call(transfer)),
    tags: [Tag.Wormhole, Tag.Ntt, Tag.NttExecutor],
  });
}

export function viaSnowbridgeTemplate(
  assetIn: Asset,
  assetOut: Asset,
  to: AnyChain
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      fee: fee(),
    },
    destination: {
      chain: to,
      asset: assetOut,
      fee: {
        amount: FeeAmountBuilder()
          .Snowbridge()
          .calculateOutboundFee({ hub: assetHub }),
        asset: dot,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).prior(ExtrinsicBuilder().polkadotXcm().execute().viaSnowbridge()),
    tags: [Tag.Snowbridge],
  });
}

// Snowbridge V1 (legacy) outbound route (Hydration -> Ethereum). Uses the
// runtime-constructed reserve transfer (transferAssetsUsingTypeAndThen) and the
// flat V1 DOT bridge fee — cheaper than V2 but the relayer absorbs Ethereum gas.
export function viaSnowbridgeV1Template(
  assetIn: Asset,
  assetOut: Asset,
  to: AnyChain
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      fee: fee(),
    },
    destination: {
      chain: to,
      asset: assetOut,
      fee: {
        amount: FeeAmountBuilder()
          .Snowbridge()
          .calculateOutboundFeeV1({ hub: assetHub }),
        asset: dot,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).prior(
      ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
        transferType: XcmTransferType.DestinationReserve,
      })
    ),
    tags: [Tag.Snowbridge, Tag.SnowbridgeV1],
  });
}
