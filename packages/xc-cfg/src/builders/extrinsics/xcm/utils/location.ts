import { encodeLocation } from '@galacticcouncil/common';
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
