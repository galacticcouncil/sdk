import { Binary } from 'polkadot-api';

/**
 * LocationEncoder converts multilocation objects with hex strings to use Binary types
 *
 * Example:
 * ```typescript
 * const locationConfig = {
 *   parents: 1,
 *   interior: {
 *     type: 'X1',
 *     value: {
 *       type: 'AccountId32',
 *       value: {
 *         id: '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
 *       }
 *     }
 *   }
 * };
 *
 * const encoded = LocationEncoder.encode(locationConfig);
 * // Returns same structure but with Binary objects for hex strings
 * ```
 */
export class LocationEncoder {
  /**
   * Encode location by converting hex strings to Binary objects
   *
   * @param location - Plain object from chain.getAssetXcmLocation(asset)
   * @returns Location with Binary objects for hex string fields
   */
  static encode(location: any): any {
    if (!location || typeof location !== 'object') {
      return location;
    }

    // If it's already a Binary object (has asBytes method), return as-is
    if (typeof location.asBytes === 'function') {
      return location;
    }

    // Handle arrays
    if (Array.isArray(location)) {
      return location.map((item) => this.encode(item));
    }

    // Handle location with parents and interior
    if (location.parents !== undefined && location.interior !== undefined) {
      return {
        parents: location.parents,
        interior: this.encodeInterior(location.interior),
      };
    }

    // Handle objects with type/value structure
    if (location.type !== undefined) {
      return this.encodeTypeValue(location);
    }

    // Handle plain objects (recursively encode all properties)
    const encoded: any = {};
    for (const [key, value] of Object.entries(location)) {
      encoded[key] = this.encode(value);
    }
    return encoded;
  }

  private static encodeInterior(interior: any): any {
    // Handle "Here" as string
    if (interior === 'Here') {
      return { type: 'Here' };
    }

    // Handle "Here" as object
    if (interior?.type === 'Here') {
      return { type: 'Here' };
    }

    // Handle X1-X8 junctions
    if (interior?.type && /^X[1-8]$/.test(interior.type)) {
      return {
        type: interior.type,
        value: this.encode(interior.value),
      };
    }

    // Fallback to recursive encoding
    return this.encode(interior);
  }

  private static encodeTypeValue(obj: any): any {
    const { type, value } = obj;

    // Special handling for types that contain hex strings that need to be Binary
    if (type === 'AccountId32' && value?.id) {
      return {
        type,
        value: {
          id: typeof value.id === 'string' ? Binary.fromHex(value.id) : value.id,
          network: value.network,
        },
      };
    }

    if (type === 'AccountKey20' && value?.key) {
      return {
        type,
        value: {
          key: typeof value.key === 'string' ? Binary.fromHex(value.key) : value.key,
          network: value.network,
        },
      };
    }

    if (type === 'GeneralKey' && value?.data) {
      return {
        type,
        value: {
          length: value.length,
          data: typeof value.data === 'string' ? Binary.fromHex(value.data) : value.data,
        },
      };
    }

    if (type === 'ByGenesis' && typeof value === 'string') {
      return {
        type,
        value: Binary.fromHex(value),
      };
    }

    // For all other types, recursively encode the value
    return {
      type,
      value: value !== undefined ? this.encode(value) : undefined,
    };
  }
}
