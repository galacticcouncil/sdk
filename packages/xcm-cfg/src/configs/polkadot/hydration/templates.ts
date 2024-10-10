import {
  Asset,
  AssetRoute,
  ExtrinsicConfigBuilderParams,
} from '@galacticcouncil/xcm-core';

import { glmr, usdt } from '../../../assets';
import {
  ContractBuilder,
  ExtrinsicBuilder,
  ExtrinsicDecorator,
  FeeAmountBuilder,
} from '../../../builders';
import { assetHub, ethereum, moonbeam, zeitgeist } from '../../../chains';

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
      ExtrinsicBuilder().xTokens().transferMultiassets().X3()
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
      ExtrinsicBuilder().xTokens().transferMultiCurrencies()
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
      ExtrinsicBuilder().xTokens().transferMultiCurrencies()
    ),
  });
}

export function toEthereumWithRelayerTemplate(
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
        amount: FeeAmountBuilder().TokenRelayer().calculateRelayerFee(),
        asset: assetOut,
      },
    },
    extrinsic: ExtrinsicDecorator(isSwapSupported, swapExtrinsic).priorMulti([
      ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
      ExtrinsicBuilder()
        .polkadotXcm()
        .send()
        .transact({ fee: MRL_EXECUTION_FEE }),
    ]),
    via: {
      chain: moonbeam,
      fee: {
        amount: MRL_XCM_FEE,
        asset: glmr,
        balance: balance(),
      },
      transact: ExtrinsicBuilder()
        .ethereumXcm()
        .transact(
          ContractBuilder()
            .Batch()
            .batchAll([
              ContractBuilder().Erc20().approve(),
              ContractBuilder().TokenRelayer().transferTokensWithRelay(),
            ])
        ),
    },
  });
}
