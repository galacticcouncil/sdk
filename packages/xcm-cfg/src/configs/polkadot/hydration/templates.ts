import {
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
  ethereum,
  moonbeam,
  solana,
  zeitgeist,
} from '../../../chains';
import { Tag } from '../../../tags';

import { balance, fee } from './configs';

export const MRL_EXECUTION_FEE = 0.9;
export const MRL_XCM_FEE = 1;

const isDestinationFeeSwapSupported = (
  params: ExtrinsicConfigBuilderParams
) => {
  const { source } = params;
  const { enabled } = source.destinationFeeSwap || {};
  return !!enabled;
};

const getSwapExtrinsicBuilder = () => {
  return ExtrinsicBuilder().router().buy({ withSlippage: 30 });
};

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
      getSwapExtrinsicBuilder()
    ).prior(ExtrinsicBuilder().xTokens().transferMultiassets()),
  });
}

export function toMoonbeamErc20Template(asset: Asset): AssetRoute {
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
      chain: moonbeam,
      asset: asset,
      fee: {
        amount: 0.08,
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      getSwapExtrinsicBuilder()
    ).prior(ExtrinsicBuilder().xTokens().transferMultiCurrencies()),
  });
}

export function toZeitgeistErc20Template(asset: Asset): AssetRoute {
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
      chain: zeitgeist,
      asset: asset,
      fee: {
        amount: 0.1,
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicDecorator(
      isDestinationFeeSwapSupported,
      getSwapExtrinsicBuilder()
    ).prior(ExtrinsicBuilder().xTokens().transferMultiCurrencies()),
  });
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
      getSwapExtrinsicBuilder()
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
        amount: FeeAmountBuilder().Snowbridge().getSendFee({ hub: assetHub }),
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
      getSwapExtrinsicBuilder()
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
