import { encodeLocation } from '@galacticcouncil/common';
import {
  Asset,
  Parachain,
  XcmLocation,
  multiloc,
} from '@galacticcouncil/xc-core';

import { XcmVersion } from '../types';

/**
 * Normalizes an asset location to the specified XCM version format
 *
 * @param assetLocation - asset xcm location
 * @param version - target xcm version
 * @returns normalized location
 */
export function getExtrinsicAssetLocation(
  assetLocation: Record<string, any>,
  version: XcmVersion
) {
  const versionNo = getVersionNo(version);

  if (versionNo >= 4) {
    return encodeLocation(assetLocation);
  }

  return applyConcreteWrapper(assetLocation);
}

function getVersionNo(version: XcmVersion) {
  const versionNo = version.toString().replace('V', '').replace('v', '');
  return Number(versionNo);
}

export function normalizeLocation(
  assetLocation: Record<string, any>
): Record<string, any> {
  return encodeLocation(assetLocation);
}

function applyConcreteWrapper(id: object) {
  return {
    Concrete: { ...id },
  };
}

const ASSET_HUB_ID = 1000;

function getReserveParachainId(
  xcmLocation: XcmLocation | undefined,
  destination: Parachain
): number | undefined {
  if (!xcmLocation) {
    return undefined;
  }

  // Native to destination (parents: 0) - destination is the reserve
  if (xcmLocation.parents === 0) {
    return destination.parachainId;
  }

  // Relay chain native (parents: 1, interior: 'Here') - Asset Hub is reserve
  if (xcmLocation.parents === 1 && xcmLocation.interior === 'Here') {
    return ASSET_HUB_ID;
  }

  // Parachain asset - extract parachain ID from location
  return multiloc.findParachain(xcmLocation);
}

export function validateReserveChain(
  asset: Asset,
  source: Parachain,
  destination: Parachain,
  reserve?: Parachain
): void {
  const xcmLocation = destination.getAssetXcmLocation(asset);
  const expectedReserveId = getReserveParachainId(xcmLocation, destination);

  if (expectedReserveId === undefined) {
    throw new Error(
      `No reserve chain for "${asset.originSymbol}" on ${destination.name}`
    );
  }

  if (reserve) {
    if (reserve.parachainId !== expectedReserveId) {
      throw new Error(
        `Wrong reserve for "${asset.originSymbol}": expected chain ${expectedReserveId}, got ${reserve.name} (${reserve.parachainId})`
      );
    }
    return;
  }

  // No explicit reserve - source or destination must be the reserve
  const sourceIsReserve = source.parachainId === expectedReserveId;
  const destIsReserve = destination.parachainId === expectedReserveId;

  if (!sourceIsReserve && !destIsReserve) {
    throw new Error(
      `Reserve chain ${expectedReserveId} required for "${asset.originSymbol}"`
    );
  }
}
