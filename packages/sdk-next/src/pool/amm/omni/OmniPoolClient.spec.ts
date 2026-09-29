import { fakeAssetBalance } from '../../../../test/balances';

import { OmniPoolClient } from './OmniPoolClient';

const AT = '0x01';
const HUB_ID = 1;

describe('OmniPoolClient loadPools', () => {
  function setup() {
    const address = OmniPoolClient.prototype['getPoolAddress']();
    const { assetBalance, reads } = fakeAssetBalance({
      [`${address}:${HUB_ID}`]: 100n,
      [`${address}:5`]: 50n,
      [`${address}:7`]: 70n,
    });
    const query = {
      assetBalance,
      hubAssetId: async () => HUB_ID,
      assetStates: {
        get: async () => [5, 7].map((id) => ({ keyArgs: [id], value: {} })),
      },
      hubTradability: { get: async () => 0 },
      assets: { get: async () => new Map() },
      limits: async () => ({}),
    };

    const client: OmniPoolClient = Object.assign(
      Object.create(OmniPoolClient.prototype),
      { query }
    );
    const load = () => client['loadPools']({ hash: AT, number: 1 });
    return { load, reads };
  }

  it('gives each token, hub last, its own reserve', async () => {
    const { load } = setup();

    const [pool] = await load();

    expect(pool.tokens.map((t) => [t.id, t.balance])).toEqual([
      [5, 50n],
      [7, 70n],
      [HUB_ID, 100n],
    ]);
  });

  it('reads every reserve in one batch', async () => {
    const { load, reads } = setup();

    await load();

    expect(reads).toHaveLength(1);
  });
});
