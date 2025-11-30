import { AnyChain, Asset, AssetRoute } from '@galacticcouncil/xc-core';

import { ExtrinsicBuilder } from '../../../builders';

import { balance, fee } from './configs';

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
