import { AnyChain, AssetRoute } from '@galacticcouncil/xcm-core';

import { ksm } from '../../../assets';
import { BalanceBuilder, ExtrinsicBuilder } from '../../../builders';

// const xcmDeliveryFee = 0.002;

export const extraFee = 0;

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
        extra: extraFee,
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
