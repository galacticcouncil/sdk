import { fakeAssetBalance } from '../../../../test/balances';

import { XykPoolClient } from './XykPoolClient';

const AT = '0x01';

describe('XykPoolClient loadPools', () => {
  function setup() {
    const { assetBalance, reads } = fakeAssetBalance({
      'pool-a:1': 10n,
      'pool-a:2': 20n,
      'pool-b:2': 200n,
      'pool-b:3': 300n,
    });
    const query = {
      assetBalance,
      poolAssets: {
        get: async () => [
          { keyArgs: ['pool-a'], value: [1, 2] },
          { keyArgs: ['pool-b'], value: [2, 3] },
        ],
      },
      assets: { get: async () => new Map() },
      limits: async () => ({}),
    };

    const client: XykPoolClient = Object.assign(
      Object.create(XykPoolClient.prototype),
      { query, decimals: new Map() }
    );
    const load = () => client['loadPools']({ hash: AT, number: 1 });
    return { load, reads };
  }

  it('gives each token its own pool reserve', async () => {
    const { load } = setup();

    const pools = await load();

    expect(
      pools.map((p) => [p.address, p.tokens.map((t) => t.balance)])
    ).toEqual([
      ['pool-a', [10n, 20n]],
      ['pool-b', [200n, 300n]],
    ]);
  });

  it('reads every reserve in one batch', async () => {
    const { load, reads } = setup();

    await load();

    expect(reads).toHaveLength(1);
  });
});
