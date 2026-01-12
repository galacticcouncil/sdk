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
      throw new Error(
        `Reserve chain ${reserve.name} (${reserve.parachainId}) provided for asset "${asset.originSymbol}", ` +
          `but asset does not require a reserve chain on ${destination.name}`
      );
    }

    if (expectedReserveId !== reserve.parachainId) {
      throw new Error(
        `Invalid reserve chain for asset "${asset.originSymbol}": ` +
          `expected parachain ${expectedReserveId}, got ${reserve.name} (${reserve.parachainId})`
      );
    }
  }

  if (!reserve && expectedReserveId !== undefined) {
    const sourceIsReserve = source.parachainId === expectedReserveId;
    const destIsReserve = destination.parachainId === expectedReserveId;

    if (!sourceIsReserve && !destIsReserve) {
      throw new Error(
        `Reserve chain required for asset "${asset.originSymbol}" on ${destination.name}: ` +
          `expected parachain ${expectedReserveId}`
      );
    }
  }
}
