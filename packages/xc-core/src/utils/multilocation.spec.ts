import { findNestedKey } from './multilocation';

describe('Multilocation utils', () => {
  describe('findNestedKey', () => {
    it('should find GlobalConsensus for native erc20 asset location', async () => {
      expect(
        findNestedKey(
          {
            parents: 2,
            interior: {
              X2: [
                {
                  GlobalConsensus: {
                    Ethereum: {
                      chainId: 1,
                    },
                  },
                },
                {
                  AccountKey20: {
                    network: null,
                    key: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                  },
                },
              ],
            },
          },
          'GlobalConsensus'
        )
      ).toStrictEqual({
        GlobalConsensus: {
          Ethereum: {
            chainId: 1,
          },
        },
      });
    });
    it('should find Parachain in asset location with X1 interior', async () => {
      expect(
        findNestedKey(
          {
            parents: 1,
            interior: {
              X1: {
                Parachain: 3369,
              },
            },
          },
          'Parachain'
        )
      ).toStrictEqual({
        Parachain: 3369,
      });
    });
  });
});
