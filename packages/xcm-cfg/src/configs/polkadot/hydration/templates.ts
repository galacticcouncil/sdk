import {
  AnyChain,
  Asset,
  AssetRoute,
  ExtrinsicConfigBuilderParams,
} from '@galacticcouncil/xcm-core';

import { dot, glmr, usdt } from '../../../assets';
import {
  ContractBuilder,
  ExtrinsicBuilder,
  ExtrinsicDecorator,
  FeeAmountBuilder,
  XcmTransferType,
} from '../../../builders';
import {
  assetHub,
  assetHubCex,
  ethereum,
  moonbeam,
  solana,
  zeitgeist,
} from '../../../chains';
import { Tag } from '../../../tags';

import { balance, fee } from './configs';

export const MRL_EXECUTION_FEE = 0.9; // Remote execution fee (< 0.9)
export const MRL_XCM_FEE = 1; // Destination fee (< 0.1) + Remote execution fee (< 0.9)

export const CEX_EXECUTION_FEE = 0.02; // Remote execution fee (< 0.02)

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
  destinationFee: number
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
        amount: destinationFee,
        asset: asset,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
        amount: 0.18,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).prior(ExtrinsicBuilder().xTokens().transferMultiassets()),
  });
}

export function toHubWithCexFwdTemplate(asset: Asset): AssetRoute {
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
        amount: 0.1,
        asset: asset,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        ExtrinsicBuilder().xTokens().transferMultiasset(),
        ExtrinsicBuilder().polkadotXcm().send().transferAsset({
          fee: CEX_EXECUTION_FEE,
        }),
      ]),
  });
}

export function toHubWithCexFwd2Template(asset: Asset): AssetRoute {
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
        amount: 0.1,
        asset: asset,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        ExtrinsicBuilder().xTokens().transferMultiasset(),
        ExtrinsicBuilder().polkadotXcm().send().transact({
          fee: CEX_EXECUTION_FEE,
        }),
      ]),
    transact: {
      chain: assetHub,
      fee: {
        amount: 0,
        asset: asset,
        balance: balance(),
      },
      extrinsic: ExtrinsicBuilder().assets().transfer(),
    },
  });
}

export function toParaErc20Template(
  asset: Asset,
  destination: AnyChain,
  destinationFee: number
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
        amount: destinationFee,
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).prior(ExtrinsicBuilder().xTokens().transferMultiCurrencies()),
  });
}

export function toMoonbeamErc20Template(asset: Asset): AssetRoute {
  return toParaErc20Template(asset, moonbeam, 0.08);
}

export function toZeitgeistErc20Template(asset: Asset): AssetRoute {
  return toParaErc20Template(asset, zeitgeist, 0.1);
}

export function toEthereumViaWormholeTemplate(
  assetIn: Asset,
  assetOut: Asset
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
      chain: ethereum,
      asset: assetOut,
      fee: {
        amount: FeeAmountBuilder()
          .Wormhole()
          .TokenRelayer()
          .calculateRelayerFee(),
        asset: assetOut,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).priorMulti([
      ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
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
      extrinsic: ExtrinsicBuilder()
        .ethereumXcm()
        .transact(
          ContractBuilder()
            .Batch()
            .batchAll([
              ContractBuilder().Erc20().approve(),
              ContractBuilder()
                .Wormhole()
                .TokenRelayer()
                .transferTokensWithRelay(),
            ])
        ),
    },
    tags: [Tag.Mrl, Tag.Wormhole],
  });
}

export function toEthereumViaSnowbridgeTemplate(
  assetIn: Asset,
  assetOut: Asset
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
      chain: ethereum,
      asset: assetOut,
      fee: {
        amount: FeeAmountBuilder()
          .Snowbridge()
          .calculateOutboundFee({ hub: assetHub }),
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    }),
    tags: [Tag.Snowbridge],
  });
}

export function toSolanaViaWormholeTemplate(
  assetIn: Asset,
  assetOut: Asset
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
      chain: solana,
      asset: assetOut,
      fee: {
        amount: FeeAmountBuilder()
          .Wormhole()
          .TokenRelayer()
          .calculateRelayerFee(),
        asset: assetOut,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      swapExtrinsicBuilder
    ).priorMulti([
      ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
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
      extrinsic: ExtrinsicBuilder()
        .ethereumXcm()
        .transact(
          ContractBuilder()
            .Batch()
            .batchAll([
              ContractBuilder().Erc20().approve(),
              ContractBuilder()
                .Wormhole()
                .TokenRelayer()
                .transferTokensWithRelay(),
            ])
        ),
    },
    tags: [Tag.Mrl, Tag.Wormhole],
  });
}

export function toHubForeignAssetTemplate(
  asset: Asset,
  destinationFee: number
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
      chain: assetHub,
      asset: asset,
      fee: {
        amount: 0.19,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    }),
  });
}
