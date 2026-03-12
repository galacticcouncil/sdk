import {
  XcmV3Junctions,
  XcmV3Junction,
  XcmV3MultiassetFungibility,
  XcmV3WeightLimit,
  XcmV4AssetAssetFilter,
  XcmV4AssetWildAsset,
  XcmV4Instruction,
} from '@galacticcouncil/descriptors';
import { Asset, Parachain } from '@galacticcouncil/xc-core';

import { Binary } from 'polkadot-api';

import { ACCOUNT_SS_58, AMOUNT_MAX, TOPIC } from './const';

import {
  getExtrinsicAccount,
  getExtrinsicAssetLocation,
  locationOrError,
} from '../utils';
import { XcmVersion } from '../types';

export function buildReserveTransfer(
  asset: Asset,
  destination: Parachain
): XcmV4Instruction[] {
  const version = XcmVersion.v4;
  const transferAssetLocation = getExtrinsicAssetLocation(
    locationOrError(destination, asset),
    version
  );

  const topic = Binary.fromHex(TOPIC);

  return [
    XcmV4Instruction.WithdrawAsset([
      {
        id: transferAssetLocation,
        fun: XcmV3MultiassetFungibility.Fungible(AMOUNT_MAX),
      },
    ]),
    XcmV4Instruction.ClearOrigin(),
    XcmV4Instruction.BuyExecution({
      fees: {
        id: transferAssetLocation,
        fun: XcmV3MultiassetFungibility.Fungible(AMOUNT_MAX),
      },
      weight_limit: XcmV3WeightLimit.Unlimited(),
    }),
    XcmV4Instruction.DepositAsset({
      assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
      beneficiary: {
        parents: 0,
        interior: XcmV3Junctions.X1(getExtrinsicAccount(ACCOUNT_SS_58)),
      },
    }),
    XcmV4Instruction.SetTopic(topic),
  ];
}

export function buildNestedReserveTransfer(
  asset: Asset,
  destination: Parachain
): XcmV4Instruction[] {
  const version = XcmVersion.v4;
  const transferAssetLocation = getExtrinsicAssetLocation(
    locationOrError(destination, asset),
    version
  );

  return [
    XcmV4Instruction.BuyExecution({
      fees: {
        id: transferAssetLocation,
        fun: XcmV3MultiassetFungibility.Fungible(AMOUNT_MAX),
      },
      weight_limit: XcmV3WeightLimit.Unlimited(),
    }),
    XcmV4Instruction.DepositAsset({
      assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
      beneficiary: {
        parents: 0,
        interior: XcmV3Junctions.X1(getExtrinsicAccount(ACCOUNT_SS_58)),
      },
    }),
  ];
}

export function buildMultiHopReserveTransfer(
  asset: Asset,
  hub: Parachain,
  destination: Parachain
): XcmV4Instruction[] {
  const version = XcmVersion.v4;

  const hubAssetLocation = getExtrinsicAssetLocation(
    locationOrError(hub, asset),
    version
  );

  const topic = Binary.fromHex(TOPIC);

  const nestedXcm = buildNestedReserveTransfer(asset, destination);

  return [
    XcmV4Instruction.WithdrawAsset([
      {
        id: hubAssetLocation,
        fun: XcmV3MultiassetFungibility.Fungible(AMOUNT_MAX),
      },
    ]),
    XcmV4Instruction.ClearOrigin(),
    XcmV4Instruction.BuyExecution({
      fees: {
        id: hubAssetLocation,
        fun: XcmV3MultiassetFungibility.Fungible(AMOUNT_MAX),
      },
      weight_limit: XcmV3WeightLimit.Unlimited(),
    }),
    XcmV4Instruction.DepositReserveAsset({
      assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
      dest: {
        parents: 1,
        interior: XcmV3Junctions.X1(
          XcmV3Junction.Parachain(destination.parachainId)
        ),
      },
      xcm: nestedXcm,
    }),
    XcmV4Instruction.SetTopic(topic),
  ];
}
