import { Asset, AssetConfig } from '@galacticcouncil/xcm-core';

import { glmr, usdt } from '../../../assets';
import {
  ContractBuilder,
  ExtrinsicBuilder,
  FeeAmountBuilder,
} from '../../../builders';
import { assetHub, ethereum, moonbeam } from '../../../chains';

import { balance, fee } from './configs';

export const MRL_EXECUTION_FEE = 0.15;
export const MRL_XCM_FEE = 0.25;

export function toAssethubExtTemplate(asset: Asset): AssetConfig {
  return new AssetConfig({
    asset: asset,
    balance: balance(),
    destination: assetHub,
    destinationFee: {
      amount: 0.18,
      asset: usdt,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiassets().X3(),
    fee: fee(),
  });
}

export function toEthereumWithRelayerTemplate(asset: Asset): AssetConfig {
  return new AssetConfig({
    asset: asset,
    balance: balance(),
    destination: ethereum,
    destinationFee: {
      amount: FeeAmountBuilder().TokenRelayer().calculateRelayerFee(),
      asset: asset,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        ExtrinsicBuilder()
          .xTokens()
          .transferMultiCurrencies({ fee: glmr, feeAmount: MRL_XCM_FEE }),
        ExtrinsicBuilder()
          .polkadotXcm()
          .send()
          .transact({ fee: glmr, feeAmount: MRL_EXECUTION_FEE }),
      ]),
    fee: fee(),
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
    via: moonbeam,
  });
}
