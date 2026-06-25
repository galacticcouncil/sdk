import { AnyChain, Asset, AssetRoute } from '@galacticcouncil/xc-core';

import { ksm } from '../../../assets';
import { ExtrinsicBuilder, XcmTransferType } from '../../../builders';

export const extraFee = 0.0015; // xcmDeliveryFee

export function toParaStablesTemplate(
  asset: Asset,
  destination: AnyChain,
  destinationFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: {
        asset: ksm,
        extra: extraFee,
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
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
  });
}
