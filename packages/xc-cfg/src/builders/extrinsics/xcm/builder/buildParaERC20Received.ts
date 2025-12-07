import {
  XcmV3Junctions,
  XcmV4Instruction,
  XcmV3MultiassetFungibility,
  XcmV4AssetAssetFilter,
  XcmV4AssetWildAsset,
  XcmV3WeightLimit,
} from '@galacticcouncil/descriptors';
import { Asset, Parachain } from '@galacticcouncil/xc-core';

import { ACCOUNT_SS_58, AMOUNT_MAX, DOT_LOCATION, TOPIC } from './const';

import { getExtrinsicAccount, getExtrinsicAssetLocation, locationOrError } from '../utils';
import { XcmVersion } from '../types';

export async function buildParaERC20Received(asset: Asset, chain: Parachain) {
  const version = XcmVersion.v4;
  const transferAssetLocation = getExtrinsicAssetLocation(
    locationOrError(chain, asset),
    version
  );

  const beneficiaryLocation: { parents: number; interior: ReturnType<typeof XcmV3Junctions.X1> } = {
    parents: 0,
    interior: XcmV3Junctions.X1(getExtrinsicAccount(ACCOUNT_SS_58)),
  };

  return {
    type: version,
    value: [
      XcmV4Instruction.ReserveAssetDeposited([
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
      XcmV4Instruction.DepositAsset({
        assets: XcmV4AssetAssetFilter.Wild(
          XcmV4AssetWildAsset.AllCounted(2)
        ),
        beneficiary: beneficiaryLocation,
      }),
      XcmV4Instruction.SetTopic(TOPIC),
    ],
  };
}
