import {
  AnyChain,
  AnyParachain,
  Asset,
  AssetRoute,
  ContractConfigBuilder,
  ExtrinsicConfigBuilderParams,
  FeeAmountConfigBuilder,
  Parachain,
} from '@galacticcouncil/xc-core';

import { dot, glmr, usdt } from '../../../assets';
import {
  BalanceBuilder,
  ContractBuilder,
  ExtrinsicBuilder,
  ExtrinsicDecorator,
  FeeAmountBuilder,
  XcmTransferType,
} from '../../../builders';
import { assetHub, kusamaAssetHub, moonbeam } from '../../../chains';
import { Tag } from '../../../tags';

import { fee } from './configs';

export const MRL_EXECUTION_FEE = 0.9; // Remote execution fee (< 0.9)
export const MRL_XCM_FEE = 1; // Destination fee (< 0.1) + Remote execution fee (< 0.9)

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

// Hydration-native erc20 asset (e.g. HOLLAR) registered as a foreign asset on
// AssetHub. The asset itself moves as LocalReserve (minted on the hub against
// Hydration's sovereign deposit) while the execution fee is paid in DOT via
// DestinationReserve, since the asset has no fee-payment pool on the hub.
export function toHubErc20Template(asset: Asset, hub: Parachain): AssetRoute {
  return new AssetRoute({
    source: {
      asset,
      balance: BalanceBuilder().evm().erc20(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: hub,
      asset,
      fee: {
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
        asset: dot,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).prior(
      ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
        transferType: XcmTransferType.LocalReserve,
        feesTransferType: XcmTransferType.DestinationReserve,
      })
    ),
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

export function toMoonbeamErc20Template(asset: Asset): AssetRoute {
  return toParaErc20Template(
    asset,
    moonbeam,
    XcmTransferType.DestinationReserve
  );
}

function viaWormholeTemplate(
  assetIn: Asset,
  assetOut: Asset,
  to: AnyChain,
  destinationFee: FeeAmountConfigBuilder | number,
  transact: ContractConfigBuilder,
  tags: Tag[]
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      fee: fee(),
      destinationFee: assetIn,
    },
    destination: {
      chain: to,
      asset: assetOut,
      fee: {
        amount: destinationFee,
        asset: assetOut,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).priorMulti([
      ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
        transferType: XcmTransferType.DestinationReserve,
      }),
      ExtrinsicBuilder().polkadotXcm().send().transact({
        fee: MRL_EXECUTION_FEE,
      }),
    ]),
    transact: {
      chain: moonbeam,
      fee: {
        amount: MRL_XCM_FEE,
        asset: glmr,
      },
      extrinsic: ExtrinsicBuilder().ethereumXcm().transact(transact),
    },
    tags: tags,
  });
}

export function viaWormholeBridgeTemplate(
  assetIn: Asset,
  assetOut: Asset,
  to: AnyChain
): AssetRoute {
  return viaWormholeTemplate(
    assetIn,
    assetOut,
    to,
    0,
    ContractBuilder()
      .Batch()
      .batchAll([
        ContractBuilder()
          .Erc20()
          .approve((ctx) => ctx.getTokenBridge()),
        ContractBuilder().Wormhole().TokenBridge().transferTokens(),
      ]),
    [Tag.Mrl, Tag.Wormhole]
  );
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
