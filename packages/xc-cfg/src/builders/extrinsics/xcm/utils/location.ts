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
  const normalizedAssetLocation = normalizeInterior(assetLocation, version);
  const versionNo = getVersionNo(version);
  return versionNo >= 4
    ? normalizedAssetLocation
    : applyConcreteWrapper(normalizedAssetLocation);
}

function getVersionNo(version: XcmVersion) {
  const versionNo = version.toString().replace('V', '').replace('v', '');
  return Number(versionNo);
}

export function normalizeLocation(
  assetLocation: Record<string, any>
): Record<string, any> {
  return normalizeInterior(assetLocation, 'V4' as XcmVersion);
}

function normalizeInterior(
  assetLocation: Record<string, any>,
  version: XcmVersion
) {
  if (getVersionNo(version) < 4) {
    return assetLocation;
  }

  const { parents, interior } = assetLocation;

  if (!interior || interior === 'Here') {
    return {
      parents,
      interior: {
        type: 'Here',
      },
    };
  }

  // Already in new format with { type, value } - return as-is
  if (interior && typeof interior === 'object' && interior.type) {
    return assetLocation;
  }

  // Handle old V3 format with X1, X2, X3, etc.
  if (interior && typeof interior === 'object') {
    // Check for X1-X8
    const junctionKey = Object.keys(interior).find((key) =>
      /^X[1-8]$/.test(key)
    );

    if (junctionKey) {
      const junctions = interior[junctionKey];

      // X1 should have a single junction object, not an array
      if (junctionKey === 'X1') {
        const singleJunction = Array.isArray(junctions)
          ? junctions[0]
          : junctions;
        return {
          parents,
          interior: {
            type: junctionKey,
            value: normalizeJunction(singleJunction),
          },
        };
      }

      // X2-X8 should have an array of junctions
      const junctionArray = Array.isArray(junctions) ? junctions : [junctions];
      return {
        parents,
        interior: {
          type: junctionKey,
          value: junctionArray.map(normalizeJunction),
        },
      };
    }
  }

  return assetLocation;
}

function normalizeJunction(junction: any): any {
  // If already in new format { type: 'JunctionName', value: ... }, normalize the value recursively
  if (junction && typeof junction === 'object' && junction.type) {
    return {
      type: junction.type,
      value: normalizeNestedValue(junction.value),
    };
  }

  // Convert old format { JunctionName: value } to new format { type: 'JunctionName', value: ... }
  if (junction && typeof junction === 'object') {
    const [type, value] = Object.entries(junction)[0];
    return {
      type,
      value: normalizeNestedValue(value),
    };
  }

  return junction;
}

function normalizeNestedValue(value: any): any {
  if (
    value &&
    typeof value === 'object' &&
    !value.type &&
    !Array.isArray(value)
  ) {
    const entries = Object.entries(value);
    if (entries.length === 1) {
      const [variantType, variantValue] = entries[0];
      return {
        type: variantType,
        value: variantValue,
      };
    }
  }

  return value;
}

function applyConcreteWrapper(id: object) {
  return {
    Concrete: { ...id },
  };
}
