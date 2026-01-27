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
  xcmLocation: XcmLocation | undefined
): number | undefined {
  if (!xcmLocation) {
    return undefined;
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
  const xcmLocation = source.getAssetXcmLocation(asset);

  const expectedReserve = getReserveParachainId(xcmLocation);
  const actualReserve = reserve?.parachainId ?? destination.parachainId;

  if (expectedReserve && actualReserve !== expectedReserve) {
    throw new Error(
      reserve
        ? `Wrong reserve for "${asset.originSymbol}": expected chain ${expectedReserve}, got ${reserve.name} (${reserve.parachainId})`
        : `Reserve chain ${expectedReserve} required for "${asset.originSymbol}"`
    );
  }
}
