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
    type: 'Concrete',
    value: encodeLocation(id),
  };
}

const ASSET_HUB_ID = 1000;

/**
 * Check if Asset Hub is the reserve for the given xcm location.
 * This includes:
 * - Relay chain native assets (DOT): parents=1, interior='Here'
 * - Cross-consensus assets (KSM): parents=2, interior has GlobalConsensus
 */
function isAssetHubReserve(xcmLocation: XcmLocation): boolean {
  const { parents, interior } = xcmLocation;

  // Relay chain native (e.g., DOT)
  if (parents === 1 && interior === 'Here') {
    return true;
  }

  // Cross-consensus (e.g., KSM from Kusama)
  if (parents === 2 && interior && interior !== 'Here') {
    const junctions = Object.values(interior).flat();
    return junctions.some(
      (j: any) => j && typeof j === 'object' && 'GlobalConsensus' in j
    );
  }

  return false;
}

function getReserveParachainId(
  xcmLocation: XcmLocation | undefined,
  destination: Parachain
): number | undefined {
  if (!xcmLocation) {
    return undefined;
  }

  // Native to destination (parents: 0)
  if (xcmLocation.parents === 0) {
    return destination.parachainId;
  }

  // Asset Hub is reserve
  if (isAssetHubReserve(xcmLocation)) {
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
