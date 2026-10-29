import { HsmPoolClient } from './HsmPoolClient';

const AT = '0x01';

describe('HsmPoolClient loadPools', () => {
  function setup() {
    const collateral = (id: number, pool_id: number) => ({
      keyArgs: [id],
      value: {
        pool_id,
        purchase_fee: 0,
        buy_back_fee: 0,
        buyback_rate: 0,
      },
    });
    const query = {
      assetBalance: {
        get: async (_at: string, _who: string, id: number) => ({
          transferable: BigInt(id * 10),
        }),
      },
      hollarId: async () => 1,
      assetLocation: {
        get: async () => ({
          interior: {
            type: 'X1',
            value: { type: 'AccountKey20', value: { key: '0x01' } },
          },
        }),
      },
      collaterals: {
        get: async () => [
          collateral(5, 100),
          collateral(6, 999),
          collateral(7, 101),
        ],
      },
      mintCapacity: { get: async () => 0n },
    };
    const stableClient = {
      getPools: async () => [
        { id: 100, tokens: [] },
        { id: 101, tokens: [] },
      ],
    };

    const client: HsmPoolClient = Object.assign(
      Object.create(HsmPoolClient.prototype),
      { query, stableClient }
    );
    return () => client['loadPools']({ hash: AT, number: 1 });
  }

  it('skips a collateral whose stable pool is missing', async () => {
    const load = setup();

    const pools = await load();

    expect(pools.map((p) => [p.collateralId, p.collateralBalance])).toEqual([
      [5, 50n],
      [7, 70n],
    ]);
  });
});
