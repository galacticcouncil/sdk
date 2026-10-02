import { fakeAssetBalance } from '../../../../test/balances';

import { StableSwapClient } from './StableSwapClient';

const AT = '0x01';

describe('StableSwapClient loadPools', () => {
  const pool = (assets: number[]) => ({
    assets,
    initial_amplification: 100,
    final_amplification: 100,
    initial_block: 0,
    final_block: 0,
    fee: 0,
  });

  function setup() {
    const address = (id: number): string =>
      StableSwapClient.prototype['getPoolAddress'](id);
    const { assetBalance, reads } = fakeAssetBalance({
      [`${address(100)}:1`]: 10n,
      [`${address(100)}:2`]: 20n,
      [`${address(101)}:2`]: 200n,
      [`${address(101)}:3`]: 300n,
      [`${address(101)}:4`]: 400n,
    });

    let release!: () => void;
    const released = new Promise<void>((r) => (release = r));
    const tradabilityReads: number[] = [];

    const query = {
      assetBalance: {
        getMany: async (...args: Parameters<typeof assetBalance.getMany>) => {
          await released;
          return assetBalance.getMany(...args);
        },
      },
      pools: {
        get: async () => [
          { keyArgs: [100], value: pool([1, 2]) },
          { keyArgs: [101], value: pool([2, 3, 4]) },
        ],
      },
      poolPegs: { get: async () => [] },
      pegs: { get: async () => undefined, set: () => {} },
      issuance: { get: async () => 0n },
      tradability: {
        get: async (_at: string, _pool: number, id: number) => {
          tradabilityReads.push(id);
          return 0;
        },
      },
      assets: { get: async () => new Map() },
      limits: async () => ({}),
    };

    const client: StableSwapClient = Object.assign(
      Object.create(StableSwapClient.prototype),
      {
        query,
        poolsData: new Map(),
        mmKeys: new Set(),
        emaKeys: new Set(),
        mmRouting: { build: () => {} },
      }
    );
    const load = () => client['loadPools']({ hash: AT, number: 1 });
    return { load, reads, release, tradabilityReads };
  }

  it('gives each token its own pool reserve', async () => {
    const { load, release } = setup();

    release();
    const pools = await load();

    // The last token of each pool is its virtual share
    expect(
      pools.map((p) => p.tokens.slice(0, -1).map((t) => t.balance))
    ).toEqual([
      [10n, 20n],
      [200n, 300n, 400n],
    ]);
  });

  it('reads every reserve in one batch', async () => {
    const { load, reads, release } = setup();

    release();
    await load();

    expect(reads).toHaveLength(1);
  });

  it('reads tradeability while the reserve batch is in flight', async () => {
    const { load, release, tradabilityReads } = setup();

    const pools = load();
    await new Promise((r) => setTimeout(r, 0));

    expect(tradabilityReads).toEqual([1, 2, 2, 3, 4]);
    release();
    await pools;
  });
});
