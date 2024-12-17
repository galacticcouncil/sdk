import { AnyJson } from '@polkadot/types-codec/types';

import { XcmVersion } from '../types';

/**
 * Get extrinsic X1 interior
 *
 * @param assetLocation - asset xcm location
 * @param version - xcm version
 * @returns normalized x1 interior if version prior to V4
 */
export function getExtrinsicAssetLocation(
  assetLocation: Record<string, AnyJson>,
  version: XcmVersion
) {
  const normalizedAssetLocation = normalizeInterior(assetLocation, version);
  const versionNo = getVersionNo(version);
  return versionNo >= 4
    ? normalizedAssetLocation
    : applyConcreteWrapper(normalizedAssetLocation);
}

export function getX1Junction(version: XcmVersion, junction: any) {
  const versionNo = getVersionNo(version);
  return versionNo >= 4 ? [junction] : junction;
}

function getVersionNo(version: XcmVersion) {
  const versionNo = version.toString().replace('V', '').replace('v', '');
  return Number(versionNo);
}

function normalizeInterior(
  assetLocation: Record<string, AnyJson>,
  version: XcmVersion
) {
  if (getVersionNo(version) < 4) {
    return assetLocation;
  }

  const { parents, interior } = assetLocation;
  if (interior && typeof interior === 'object' && 'X1' in interior) {
    return {
      parents,
      interior: {
        X1: Array.isArray(interior.X1) ? interior.X1 : [interior.X1],
      },
    };
  }
  return assetLocation;
}

function applyConcreteWrapper(id: object) {
  return {
    Concrete: { ...id },
  };
}
