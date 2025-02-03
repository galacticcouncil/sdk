import { AnyChain, AssetRoute } from '@galacticcouncil/xcm-core';

import { dot } from '../../../assets';
import { BalanceBuilder, ExtrinsicBuilder } from '../../../builders';

export const xcmDeliveryFee = 0.047;

export function toParaTemplate(
  destination: AnyChain,
  destinationFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: destination,
      asset: dot,
      fee: {
        amount: destinationFee,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().xcmPallet().limitedReserveTransferAssets(),
  });
}
