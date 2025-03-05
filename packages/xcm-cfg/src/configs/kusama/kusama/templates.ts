import { AnyChain, AssetRoute } from '@galacticcouncil/xcm-core';

import { ksm } from '../../../assets';
import { BalanceBuilder, ExtrinsicBuilder } from '../../../builders';

export const xcmDeliveryFee = 0.002;

export function toParaTemplate(
  destination: AnyChain,
  destinationFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      fee: {
        asset: ksm,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: destination,
      asset: ksm,
      fee: {
        amount: destinationFee,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilder().xcmPallet().limitedReserveTransferAssets(),
  });
}
