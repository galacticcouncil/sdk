import {
  AnyChain,
  Asset,
  AssetRoute,
  Parachain,
} from '@galacticcouncil/xc-core';

import {
  ExtrinsicBuilder,
  FeeAmountBuilder,
  XcmTransferType,
} from '../../../builders';

import { balance, fee } from './configs';

export function toTransferTemplate(
  asset: Asset,
  destination: AnyChain,
  reserve?: Parachain
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
        amount: FeeAmountBuilder()
          .XcmPaymentApi()
          .calculateDestFee(
            reserve ? { reserve } : undefined
          ),
        asset: asset,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
  });
}
