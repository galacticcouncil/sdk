import {
  XcmV4Instruction,
  XcmV3MultiassetFungibility,
  XcmV3WeightLimit,
  XcmVersionedXcm,
} from '@galacticcouncil/descriptors';
import { Asset, Parachain } from '@galacticcouncil/xc-core';

import {
  ACCOUNT_KEY_20,
  ACCOUNT_SS_58,
  AMOUNT_MAX,
  DOT_LOCATION,
  TOPIC,
} from './const';

import { toBridgeXcmOnDest } from '../polkadotXcm.utils';
import {
  getExtrinsicAccount,
  getExtrinsicAssetLocation,
  locationOrError,
} from '../utils';
import { XcmVersion } from '../types';

export function buildERC20TransferFromPara(
  asset: Asset,
  chain: Parachain
): XcmV4Instruction[] {
  const version = XcmVersion.v4;
  const transferAssetLocation = getExtrinsicAssetLocation(
    locationOrError(chain, asset),
    version
  );
  const bridgeXcmOnDest = toBridgeXcmOnDest(
    XcmVersion.v4,
    getExtrinsicAccount(ACCOUNT_KEY_20),
    getExtrinsicAccount(ACCOUNT_SS_58),
    transferAssetLocation,
    TOPIC
  );

  return [
    XcmV4Instruction.WithdrawAsset([
      {
        id: DOT_LOCATION,
        fun: XcmV3MultiassetFungibility.Fungible(AMOUNT_MAX),
      },
      {
        id: transferAssetLocation,
        fun: XcmV3MultiassetFungibility.Fungible(AMOUNT_MAX),
      },
    ]),
    XcmV4Instruction.ClearOrigin(),
    XcmV4Instruction.BuyExecution({
      fees: {
        id: DOT_LOCATION,
        fun: XcmV3MultiassetFungibility.Fungible(AMOUNT_MAX),
      },
      weight_limit: XcmV3WeightLimit.Unlimited(),
    }),
    ...bridgeXcmOnDest.value,
  ];
}
