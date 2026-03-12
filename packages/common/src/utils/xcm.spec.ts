import { Binary, FixedSizeBinary } from 'polkadot-api';

import { transform } from './xcm';

const formatter = (_: any, val: any) => {
  if (val instanceof Binary) {
    return FixedSizeBinary.fromBytes(val.asBytes()).asHex();
  }

  if (typeof val === 'bigint') {
    return val.toString();
  }

  return val;
};

describe('Location Utils', () => {
  it('Convert object location to papi', () => {
    const location = {
      parents: 2,
      interior: {
        X2: [
          {
            GlobalConsensus: {
              Ethereum: {
                chain_id: 1,
              },
            },
          },
          {
            AccountKey20: {
              network: null,
              key: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
            },
          },
        ],
      },
    };

    const t = transform(location);
    //console.log(JSON.stringify(t, formatter, 2));
  });
});
