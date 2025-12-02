import { FixedSizeBinary } from 'polkadot-api';

export const toAccountId32 = (address: string) => {
  return {
    type: 'AccountId32',
    value: {
      network: undefined,
      id: FixedSizeBinary.fromHex(address),
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
