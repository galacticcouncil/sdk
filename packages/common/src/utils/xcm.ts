import { AccountId, Binary, FixedSizeBinary } from 'polkadot-api';

export const toAccountId32 = (address: string) => {
  const ss58 = AccountId().enc(address);
  return {
    type: 'AccountId32',
    value: {
      network: undefined,
      id: FixedSizeBinary.fromBytes(ss58),
    },
  };
};

export const toAccountKey20 = (address: string) => {
  return {
    type: 'AccountKey20',
    value: {
      network: undefined,
      key: FixedSizeBinary.fromHex(address),
    },
  };
};

export const transform = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(transform);
  } else if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);

    if (keys.length === 1) {
      const key = keys[0];
      const value = obj[key];

      // AccountKey20 with network and key
      if (key === 'AccountKey20' && typeof value === 'object') {
        const result = toAccountKey20(value.key);
        if (value.network) {
          result.value.network = transform(value.network);
        }
        return result;
      }

      // AccountId32 with network and id
      if (key === 'AccountId32' && typeof value === 'object') {
        const result = toAccountId32(value.id);
        if (value.network) {
          result.value.network = transform(value.network);
        }
        return result;
      }

      // GeneralKey with data
      if (
        key === 'GeneralKey' &&
        typeof value === 'object' &&
        'data' in value
      ) {
        return {
          type: key,
          value: {
            length: value.length,
            data:
              typeof value.data === 'string'
                ? Binary.fromHex(value.data)
                : value.data,
          },
        };
      }

      if (
        key === 'GlobalConsensus' &&
        typeof value === 'object' &&
        ('Polkadot' in value || 'Kusama' in value)
      ) {
        return {
          type: key,
          value: value,
        };
      }

      if (key === 'Ethereum') {
        return {
          type: key,
          value: {
            chain_id: BigInt(
              'chainId' in value ? value.chainId : value.chain_id
            ),
          },
        };
      }

      if (key === 'PalletInstance') {
        return {
          type: key,
          value: value,
        };
      }

      if (key === 'GeneralIndex') {
        return {
          type: key,
          value: BigInt(value),
        };
      }

      if (key === 'X1' && Array.isArray(value)) {
        return {
          type: key,
          value:
            value.length === 1 ? transform(value[0]) : value.map(transform),
        };
      }

      if (typeof value === 'string') {
        return {
          type: key,
          value: {
            type: value,
          },
        };
      }

      if (typeof value === 'number') {
        return {
          type: key,
          value: value,
        };
      }

      return {
        type: key,
        value: transform(value),
      };
    } else {
      const newObj: any = {};
      for (const k of keys) {
        const v = obj[k];
        newObj[k] = transform(v);
      }
      return newObj;
    }
  } else {
    return obj;
  }
};

export function encodeLocation(location: any): any {
  if (!location || typeof location !== 'object') {
    return location;
  }

  const { parents, interior } = location;

  if (!interior || interior === 'Here') {
    return {
      parents,
      interior: {
        type: 'Here',
      },
    };
  }

  //transform interior
  return {
    parents,
    interior: transform(interior),
  };
}

export function encodeAssetId(assetId: any): any {
  // Handle simple types (number, string, bigint) - return as-is
  if (
    typeof assetId === 'number' ||
    typeof assetId === 'string' ||
    typeof assetId === 'bigint'
  ) {
    return assetId;
  }

  // Handle null/undefined
  if (assetId === null || assetId === undefined) {
    return assetId;
  }

  // Handle object types (e.g., { Token2: 0 }, { Native: "BNC" })
  if (typeof assetId === 'object' && !Array.isArray(assetId)) {
    const transformed = transform(assetId);
    return transformed;
  }
}
