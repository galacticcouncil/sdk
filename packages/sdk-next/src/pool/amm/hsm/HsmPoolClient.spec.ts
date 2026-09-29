import { fakeAssetBalance } from '../../../../test/balances';

import { HsmPoolClient } from './HsmPoolClient';

const AT = '0x01';

describe('HsmPoolClient loadPools', () => {
  function setup() {
    const facilitator: string =
      HsmPoolClient.prototype['getFacilitatorAddress']();
    const { assetBalance, reads } = fakeAssetBalance({
      [`${facilitator}:5`]: 50n,
      [`${facilitator}:7`]: 70n,
    });
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
      assetBalance,
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
    const load = () => client['loadPools']({ hash: AT, number: 1 });
    return { load, reads };
  }

  it('gives each collateral its own facilitator balance', async () => {
    const { load } = setup();

    const pools = await load();

    expect(pools.map((p) => [p.collateralId, p.collateralBalance])).toEqual([
      [5, 50n],
      [7, 70n],
    ]);
  });

  it('reads every collateral balance in one batch', async () => {
    const { load, reads } = setup();

    await load();

    expect(reads).toHaveLength(1);
  });

  it('skips a collateral whose stable pool is missing', async () => {
    const { load, reads } = setup();

    const pools = await load();

    expect(pools.map((p) => p.collateralId)).toEqual([5, 7]);
    expect(reads.flat().map(([, id]) => id)).toEqual([5, 7]);
  });
});
