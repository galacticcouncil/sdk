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

export function getReserveParachainId(
  xcmLocation: XcmLocation | undefined
): number | undefined {
  if (!xcmLocation) {
    return undefined;
  }

  if (xcmLocation.interior === 'Here') {
    return undefined;
  }

  return multiloc.findParachain(xcmLocation);
}

const ASSET_HUB_ID = 1000;

export function validateReserveChain(
  asset: Asset,
  source: Parachain,
  destination: Parachain,
  reserve?: Parachain
): void {
  const xcmLocation = destination.getAssetXcmLocation(asset);
  const expectedReserveId = getReserveParachainId(xcmLocation);

  if (reserve) {
    if (expectedReserveId === undefined) {
      const pointsToParentChain =
        xcmLocation?.parents === 1 && xcmLocation?.interior === 'Here';
      if (pointsToParentChain && reserve.parachainId === ASSET_HUB_ID) {
        return;
      }
      throw new Error(
        `No reserve chain for "${asset.originSymbol}" on ${destination.name}`
      );
    }

    if (expectedReserveId !== reserve.parachainId) {
      throw new Error(
        `Wrong reserve chain for "${asset.originSymbol}": expected ${expectedReserveId}, got ${reserve.parachainId}`
      );
    }
  }

  if (!reserve && expectedReserveId !== undefined) {
    const sourceIsReserve = source.parachainId === expectedReserveId;
    const destIsReserve = destination.parachainId === expectedReserveId;

    if (!sourceIsReserve && !destIsReserve) {
      throw new Error(
        `Reserve chain ${expectedReserveId} required for "${asset.originSymbol}"`
      );
    }
  }
}
