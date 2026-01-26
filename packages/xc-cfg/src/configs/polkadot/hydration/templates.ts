import {
  AnyChain,
  Asset,
  AssetRoute,
  ContractConfigBuilder,
  ExtrinsicConfigBuilder,
  ExtrinsicConfigBuilderParams,
  FeeAmountConfigBuilder,
  Parachain,
} from '@galacticcouncil/xc-core';

import { dot, glmr, usdt } from '../../../assets';
import {
  ContractBuilder,
  ExtrinsicBuilder,
  ExtrinsicDecorator,
  FeeAmountBuilder,
  XcmTransferType,
} from '../../../builders';
import { assetHub, assetHubCex, moonbeam, zeitgeist } from '../../../chains';
import { Tag } from '../../../tags';

import { balance, fee } from './configs';

export const MRL_EXECUTION_FEE = 0.9; // Remote execution fee (< 0.9)
export const MRL_XCM_FEE = 1; // Destination fee (< 0.1) + Remote execution fee (< 0.9)

export const GLMR_MIN_DEST_FEE = 1; // Minimum GLMR fee to meet swap threshold

export const CEX_EXECUTION_FEE = 0.03; // Remote execution fee (< 0.02)

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
  reserve?: Parachain
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
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

export function toHubExtTemplate(asset: Asset): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: assetHub,
      asset: asset,
      fee: {
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).prior(ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets()),
  });
}

export function toHubWithCexFwdTemplate(
  asset: Asset,
  hubFee: number,
  hubTransfer: ExtrinsicConfigBuilder
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: assetHubCex,
      asset: asset,
      fee: {
        amount: hubFee,
        asset: asset,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        hubTransfer,
        ExtrinsicBuilder().polkadotXcm().send().transferAsset({
          fee: CEX_EXECUTION_FEE,
        }),
      ]),
  });
}

export function toParaErc20Template(
  asset: Asset,
  destination: Parachain,
  transferType: XcmTransferType = XcmTransferType.LocalReserve
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
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

export function toZeitgeistErc20Template(asset: Asset): AssetRoute {
  return toParaErc20Template(asset, zeitgeist);
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
      balance: balance(),
      fee: fee(),
      destinationFee: {
        asset: assetIn,
        balance: balance(),
      },
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
        balance: balance(),
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

export function viaWormholeRelayerTemplate(
  assetIn: Asset,
  assetOut: Asset,
  to: AnyChain
): AssetRoute {
  return viaWormholeTemplate(
    assetIn,
    assetOut,
    to,
    FeeAmountBuilder().Wormhole().TokenRelayer().calculateRelayerFee(),
    ContractBuilder()
      .Batch()
      .batchAll([
        ContractBuilder()
          .Erc20()
          .approve((ctx) => ctx.getTokenRelayer()),
        ContractBuilder().Wormhole().TokenRelayer().transferTokensWithRelay(),
      ]),
    [Tag.Mrl, Tag.Wormhole, Tag.Relayer]
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
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
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
    ).prior(
      ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
        transferType: XcmTransferType.DestinationReserve,
      })
    ),
    tags: [Tag.Snowbridge],
  });
}
