import {
  XcmV3MultiassetFungibility,
  XcmV5AssetFilter,
  XcmV5Instruction,
  XcmV5Junctions,
  XcmV5Junction,
  XcmV5WildAsset,
} from '@galacticcouncil/descriptors';
import { Asset, Parachain } from '@galacticcouncil/xc-core';

import { FixedSizeBinary } from 'polkadot-api';

import { ACCOUNT_ID_32, AMOUNT_MAX, DOT_LOCATION, TOPIC } from './const';

import { getExtrinsicAssetLocation, locationOrError } from '../utils';
import { XcmVersion } from '../types';

/**
 * Builds the V5 XCM program that InitiateTransfer generates on the
 * destination parachain (e.g. Hydration). Used for weight/fee estimation.
 *
 * This matches what actually executes on the destination:
 * 1. ReserveAssetDeposited(DOT)
 * 2. PayFees(DOT)
 * 3. ReserveAssetDeposited(token)
 * 4. ClearOrigin
 * 5. RefundSurplus
 * 6. DepositAsset
 * 7. SetTopic
 */
export function buildParaERC20ReceivedV5(
  asset: Asset,
  chain: Parachain
): XcmV5Instruction[] {
  const version = XcmVersion.v5;
  const transferAssetLocation = getExtrinsicAssetLocation(
    locationOrError(chain, asset),
    version
  );

  const topic = FixedSizeBinary.fromHex(TOPIC);
  const beneficiary = {
    parents: 0,
    interior: XcmV5Junctions.X1(
      XcmV5Junction.AccountId32({
        id: FixedSizeBinary.fromHex(ACCOUNT_ID_32),
        network: undefined,
      })
    ),
  };

  return [
    XcmV5Instruction.ReserveAssetDeposited([
      {
        id: DOT_LOCATION,
        fun: XcmV3MultiassetFungibility.Fungible(AMOUNT_MAX),
      },
    ]),
    XcmV5Instruction.PayFees({
      asset: {
        id: DOT_LOCATION,
        fun: XcmV3MultiassetFungibility.Fungible(AMOUNT_MAX),
      },
    }),
    XcmV5Instruction.ReserveAssetDeposited([
      {
        id: transferAssetLocation,
        fun: XcmV3MultiassetFungibility.Fungible(AMOUNT_MAX),
      },
    ]),
    XcmV5Instruction.ClearOrigin(),
    XcmV5Instruction.RefundSurplus(),
    XcmV5Instruction.DepositAsset({
      assets: XcmV5AssetFilter.Wild(XcmV5WildAsset.AllCounted(3)),
      beneficiary,
    }),
    XcmV5Instruction.SetTopic(topic),
  ];
}