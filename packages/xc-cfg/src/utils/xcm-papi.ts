import { Enum, Binary } from 'polkadot-api';

/**
 * Recursively wraps XCM structures with Enum() for PAPI unsafe API
 * Converts { type: 'X', value: Y } to Enum('X', Y)
 * Also handles versioned XCM format like { V4: [...] } -> Enum('V4', [...])
 */
export function wrapWithEnum(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => wrapWithEnum(item));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);

    // Check if this is a versioned wrapper like { V4: [...] }
    if (keys.length === 1 && keys[0].match(/^V\d+$/)) {
      const version = keys[0];
      return Enum(version, wrapWithEnum(obj[version]));
    }

    // Check if this has type/value structure
    if ('type' in obj) {
      const { type, value } = obj;

      // Special case: SetTopic value should be Binary
      if (type === 'SetTopic' && typeof value === 'string' && value.startsWith('0x')) {
        return Enum(type, Binary.fromHex(value));
      }

      // Special case: X1 junction should have a single object, not an array
      // If the value is an array with one element, unwrap it
      if (type === 'X1' && Array.isArray(value) && value.length === 1) {
        return Enum(type, wrapWithEnum(value[0]));
      }

      // If there's a value, recursively wrap it
      if (value !== undefined) {
        return Enum(type, wrapWithEnum(value));
      }

      // No value, just the type
      return Enum(type);
    }

    // Otherwise, recursively wrap all properties
    const wrapped: any = {};
    for (const [key, val] of Object.entries(obj)) {
      // Convert hex strings to Binary for specific fields (id, key for AccountKey20/AccountId32)
      if (typeof val === 'string' && val.startsWith('0x') && (key === 'id' || key === 'key')) {
        wrapped[key] = Binary.fromHex(val);
      } else if (val !== null || (val === undefined && key === 'network')) {
        // Always include network field even if undefined, skip other null values
        wrapped[key] = wrapWithEnum(val);
      }
    }
    return wrapped;
  }

  // Primitive values (string, number, bigint, etc.)
  return obj;
}
