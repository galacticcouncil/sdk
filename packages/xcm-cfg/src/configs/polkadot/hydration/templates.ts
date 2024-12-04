import {
  Asset,
  AssetRoute,
  ExtrinsicConfigBuilderParams,
} from '@galacticcouncil/xcm-core';

import { dot, glmr, usdt } from '../../../assets';
import {
  ContractBuilder,
  ExtrinsicBuilder,
  ExtrinsicBuilderV4,
  ExtrinsicDecorator,
  FeeAmountBuilder,
  XcmTransferType,
} from '../../../builders';
import { assetHub, ethereum, moonbeam, zeitgeist } from '../../../chains';
import { Tag } from '../../../tags';

import { balance, fee } from './configs';

export const MRL_EXECUTION_FEE = 0.9;
export const MRL_XCM_FEE = 1;

const isSwapSupported = (params: ExtrinsicConfigBuilderParams) => {
  const { source } = params;
  const { enabled } = source.feeSwap || {};
  return !!enabled;
};

const swapExtrinsic = ExtrinsicBuilder().router().buy({ withSlippage: 30 });

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
    extrinsic: ExtrinsicDecorator(isSwapSupported, swapExtrinsic).prior(
      ExtrinsicBuilderV4().xTokens().transferMultiassets()
    ),
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
    extrinsic: ExtrinsicDecorator(isSwapSupported, swapExtrinsic).prior(
      ExtrinsicBuilderV4().xTokens().transferMultiCurrencies()
    ),
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
    extrinsic: ExtrinsicDecorator(isSwapSupported, swapExtrinsic).prior(
      ExtrinsicBuilderV4().xTokens().transferMultiCurrencies()
    ),
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
    extrinsic: ExtrinsicDecorator(isSwapSupported, swapExtrinsic).priorMulti([
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
        amount: FeeAmountBuilder().Snowbridge().getSendFee(),
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilderV4()
      .polkadotXcm()
      .transferAssetsUsingTypeAndThen({
        transferType: XcmTransferType.DestinationReserve,
      }),
    tags: [Tag.Snowbridge],
  });
}
