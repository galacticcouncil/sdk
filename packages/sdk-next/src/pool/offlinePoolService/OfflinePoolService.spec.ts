import { OfflinePoolService } from './OfflinePoolService';
import { OfflinePoolUtils } from './utils/OfflinePoolUtils';
import {
  AssetType,
  IOfflinePoolServiceDataSource,
  IPersistentConstants,
  IPersistentDataInput,
} from './types';
import { PoolFee, PoolBase, PoolPair, PoolType } from '../types';

const MOCK_CONSTANTS: IPersistentConstants = {
  lbpRepayFee: [1, 100],
  lbpMaxInRatio: '3',
  lbpMaxOutRatio: '3',
  lbpMinPoolLiquidity: '1000',
  lbpMinTradingLimit: '1000',
  omnipoolBurnProtocolFee: 0,
  omnipoolHdxAssetId: 0,
  omnipoolHubAssetId: 1,
  omnipoolMaxInRatio: '3',
  omnipoolMaxOutRatio: '3',
  omnipoolMinimumPoolLiquidity: '1000',
  omnipoolMinimumTradingLimit: '1000',
  omnipoolMinWithdrawalFee: 0,
  stableswapMinTradingLimit: '1000',
  stableswapMinPoolLiquidity: '1000',
  stableswapAmplificationRange: [2, 10000],
  xykGetExchangeFee: [3, 1000],
  xykMaxInRatio: '3',
  xykMaxOutRatio: '3',
  xykMinPoolLiquidity: '1000',
  xykMinTradingLimit: '1000',
  xykNativeAssetId: 0,
  xykOracleSource: 'xyk',
  dynamicFeesAssetFeeParameters: {
    minFee: 2500,
    maxFee: 400000,
    decay: '100000',
    amplification: '10000',
  },
  dynamicFeesProtocolFeeParameters: {
    minFee: 500,
    maxFee: 50000,
    decay: '100000',
    amplification: '10000',
  },
};

describe('OfflinePoolService', () => {
  const mockDataSource: IOfflinePoolServiceDataSource = {
    assets: [
      {
        id: '2',
        decimals: 12,
        symbol: 'DOT',
        existentialDeposit: '1000000',
        isSufficient: true,
        type: AssetType.Token,
        dynamicFee: { assetFee: 3000, protocolFee: 1000, timestamp: 100 },
      },
      {
        id: '0',
        decimals: 12,
        symbol: 'HDX',
        existentialDeposit: '1000000',
        isSufficient: true,
        type: AssetType.Token,
        dynamicFee: { assetFee: 3000, protocolFee: 1000, timestamp: 100 },
      },
      {
        id: '1',
        decimals: 12,
        symbol: 'LRNA',
        existentialDeposit: '0',
        isSufficient: true,
        type: AssetType.Token,
        dynamicFee: { assetFee: 3000, protocolFee: 1000, timestamp: 100 },
      },
    ],
    pools: {
      lbp: [
        {
          address: 'lbp_pool_address',
          type: PoolType.LBP,
          fee: [5, 1000] as PoolFee,
          repayFeeApply: false,
          tokens: [
            {
              id: 2,
              decimals: 12,
              balance: BigInt('1000000000000'),
              existentialDeposit: BigInt('1000'),
              type: AssetType.Token,
            } as any,
            {
              id: 0,
              decimals: 12,
              balance: BigInt('1000000000000'),
              existentialDeposit: BigInt('1000'),
              type: AssetType.Token,
            } as any,
          ],
          maxInRatio: BigInt(3),
          maxOutRatio: BigInt(3),
          minTradingLimit: BigInt(1000),
        } as any,
      ],
      xyk: [
        {
          address: 'xyk_pool_address',
          type: PoolType.XYK,
          tokens: [
            {
              id: 2,
              decimals: 12,
              balance: BigInt('1000000000000'),
              existentialDeposit: BigInt('1000'),
              type: AssetType.Token,
            } as any,
            {
              id: 0,
              decimals: 12,
              balance: BigInt('1000000000000'),
              existentialDeposit: BigInt('1000'),
              type: AssetType.Token,
            } as any,
          ],
          maxInRatio: BigInt(3),
          maxOutRatio: BigInt(3),
          minTradingLimit: BigInt(1000),
        },
      ],
      stableswap: [
        {
          address: 'stable_pool_address',
          id: 100,
          type: PoolType.Stable,
          fee: [4, 1000] as PoolFee,
          amplification: BigInt(100),
          isRampPeriod: false,
          totalIssuance: BigInt('1000000000000'),
          pegs: [['1', '1']],
          tokens: [
            {
              id: 2,
              decimals: 12,
              balance: BigInt('1000000000000'),
              existentialDeposit: BigInt('1000'),
              type: AssetType.Token,
            } as any,
          ],
          maxInRatio: BigInt(3),
          maxOutRatio: BigInt(3),
          minTradingLimit: BigInt(1000),
        } as any,
      ],
      omnipool: [
        {
          address: 'omni_pool_address',
          type: PoolType.Omni,
          tokens: [
            {
              id: 2,
              decimals: 12,
              balance: BigInt('1000000000000'),
              hubReserves: BigInt('1000000000000'),
              shares: BigInt('1000000000000'),
              cap: BigInt('1000000000000'),
              protocolShares: BigInt('1000000000000'),
              existentialDeposit: BigInt('1000'),
              type: AssetType.Token,
            } as any,
            {
              id: 0,
              decimals: 12,
              balance: BigInt('1000000000000'),
              hubReserves: BigInt('1000000000000'),
              shares: BigInt('1000000000000'),
              cap: BigInt('1000000000000'),
              protocolShares: BigInt('1000000000000'),
              existentialDeposit: BigInt('1000'),
              type: AssetType.Token,
            } as any,
          ],
          maxInRatio: BigInt(3),
          maxOutRatio: BigInt(3),
          minTradingLimit: BigInt(1000),
          hubAssetId: 1,
        },
      ],
      aave: [
        {
          address: 'aave_pool_address',
          type: PoolType.Aave,
          tokens: [
            {
              id: 2,
              decimals: 12,
              balance: BigInt('1000000000000'),
              existentialDeposit: BigInt('1000'),
              type: AssetType.Token,
            } as any,
          ],
          maxInRatio: BigInt(3),
          maxOutRatio: BigInt(3),
          minTradingLimit: BigInt(1000),
        },
      ],
    },
    extras: { omnipool: { maxSlipFee: 20 } },
    constants: MOCK_CONSTANTS,
    emaOracle: [
      {
        source: 'omnipool',
        period: 'Short',
        assets: ['1', '2'],
        entry: {
          price: { n: '1', d: '1' },
          volume: { aIn: '0', bOut: '0', aOut: '0', bIn: '0' },
          liquidity: { a: '1000000000000', b: '1000000000000' },
          updatedAt: 100,
        },
      },
      // Required for non-LRNA sell test (HDX → DOT, oracle key '0-1')
      {
        source: 'omnipool',
        period: 'Short',
        assets: ['0', '1'],
        entry: {
          price: { n: '1', d: '1' },
          volume: { aIn: '0', bOut: '0', aOut: '0', bIn: '0' },
          liquidity: { a: '1000000000000', b: '1000000000000' },
          updatedAt: 100,
        },
      },
    ],
    mmOracle: [],
    meta: {
      paraBlockNumber: 100,
      paraBlockHash: 'hash',
      relayBlockNumber: 100,
    },
  };

  let service: OfflinePoolService;

  beforeEach(() => {
    service = new OfflinePoolService(mockDataSource);
  });

  // ── Initialization ────────────────────────────────────────────────────────

  it('should initialize with on-chain assets', () => {
    expect(service.assets.length).toBe(3);
    expect(service.assets.some((a) => a.symbol === 'DOT')).toBe(true);
    expect(service.assets.some((a) => a.symbol === 'HDX')).toBe(true);
    expect(service.assets.some((a) => a.symbol === 'LRNA')).toBe(true);
  });

  // ── Builder pattern ───────────────────────────────────────────────────────

  it('should return empty pools if no pool type is activated', async () => {
    const pools = await service.getPools();
    expect(pools.length).toBe(0);
  });

  it('should return only XYK pools when withXyk() is called', async () => {
    service.withXyk();
    const pools = await service.getPools();
    expect(pools.length).toBe(1);
    expect(pools[0].type).toBe(PoolType.XYK);
  });

  it('should return only Omnipool pools when withOmnipool() is called', async () => {
    service.withOmnipool();
    const pools = await service.getPools();
    expect(pools.length).toBe(1);
    expect(pools[0].type).toBe(PoolType.Omni);
  });

  it('should return only LBP pools when withLbp() is called', async () => {
    service.withLbp();
    const pools = await service.getPools();
    expect(pools.length).toBe(1);
    expect(pools[0].type).toBe(PoolType.LBP);
  });

  it('should return only StableSwap pools when withStableswap() is called', async () => {
    service.withStableswap();
    const pools = await service.getPools();
    expect(pools.length).toBe(1);
    expect(pools[0].type).toBe(PoolType.Stable);
  });

  it('should return only Aave pools when withAave() is called', async () => {
    service.withAave();
    const pools = await service.getPools();
    expect(pools.length).toBe(1);
    expect(pools[0].type).toBe(PoolType.Aave);
  });

  it('should return pools from all activated types when multiple are chained', async () => {
    service.withXyk().withOmnipool().withLbp().withStableswap().withAave();
    const pools = await service.getPools();
    expect(pools.length).toBe(5);
    expect(pools.some((p) => p.type === PoolType.XYK)).toBe(true);
    expect(pools.some((p) => p.type === PoolType.Omni)).toBe(true);
    expect(pools.some((p) => p.type === PoolType.LBP)).toBe(true);
    expect(pools.some((p) => p.type === PoolType.Stable)).toBe(true);
    expect(pools.some((p) => p.type === PoolType.Aave)).toBe(true);
  });

  // ── XYK validity filtering ────────────────────────────────────────────────

  it('should exclude XYK pools whose tokens are not in the asset registry', async () => {
    const serviceWithUnknown = new OfflinePoolService({
      ...mockDataSource,
      pools: {
        ...mockDataSource.pools,
        xyk: [
          {
            ...mockDataSource.pools.xyk[0],
            tokens: [
              // Asset id 999 is not in the mock asset registry
              {
                id: 999,
                decimals: 12,
                balance: BigInt('1000000000000'),
                existentialDeposit: BigInt('1000'),
                type: AssetType.Token,
              } as any,
              {
                id: 0,
                decimals: 12,
                balance: BigInt('1000000000000'),
                existentialDeposit: BigInt('1000'),
                type: AssetType.Token,
              } as any,
            ],
          },
        ],
      },
    }).withXyk();

    const pools = await serviceWithUnknown.getPools();
    expect(pools.length).toBe(0);
  });

  it('should include XYK pools whose tokens are all in the asset registry', async () => {
    service.withXyk();
    const pools = await service.getPools();
    expect(pools.length).toBe(1);
  });

  // ── Pool fees ─────────────────────────────────────────────────────────────

  it('should return exchange fee for XYK', async () => {
    const pool: PoolBase = mockDataSource.pools.xyk[0];
    const pair: PoolPair = { assetIn: 2, assetOut: 0 } as any;
    const fees = await service.getPoolFees(pair, pool as any);
    expect(fees).toEqual({ exchangeFee: [3, 1000] });
  });

  it('should return exchange fee and repay fee for LBP', async () => {
    const pool = mockDataSource.pools.lbp[0];
    const pair: PoolPair = { assetIn: 2, assetOut: 0 } as any;
    const fees = await service.getPoolFees(pair, pool as any);
    expect(fees).toEqual({
      exchangeFee: [5, 1000],
      repayFee: [1, 100],
    });
  });

  it('should return fee for StableSwap', async () => {
    const pool = mockDataSource.pools.stableswap[0];
    const pair: PoolPair = { assetIn: 2, assetOut: 0 } as any;
    const fees = await service.getPoolFees(pair, pool as any);
    expect(fees).toEqual({ fee: [4, 1000] });
  });

  it('should return empty fees for Aave', async () => {
    const pool = mockDataSource.pools.aave[0];
    const pair: PoolPair = { assetIn: 2, assetOut: 0 } as any;
    const fees = await service.getPoolFees(pair, pool as any);
    expect(fees).toEqual({});
  });

  it('should return zero protocol fee for Omnipool LRNA sell (assetIn = LRNA)', async () => {
    const pool = mockDataSource.pools.omnipool[0];
    const pair: PoolPair = {
      assetIn: 1, // LRNA (HUB_ASSET_ID) → no protocol fee
      assetOut: 2, // DOT
      balanceIn: BigInt('1000000000000'),
      balanceOut: BigInt('1000000000000'),
    } as any;
    const fees = await service.getPoolFees(pair, pool as any);
    expect(fees).toEqual({
      assetFee: [3000, 1000000],
      protocolFee: [0, 1000000],
      min: [2500, 1000000],
      max: [400000, 1000000],
      maxSlipFee: [20, 1000000],
    });
  });

  it('should return non-zero protocol fee for Omnipool non-LRNA sell (assetIn ≠ LRNA)', async () => {
    const pool = mockDataSource.pools.omnipool[0];
    const pair: PoolPair = {
      assetIn: 0, // HDX (not LRNA) → protocol fee applies
      assetOut: 2, // DOT
      balanceIn: BigInt('1000000000000'),
      balanceOut: BigInt('1000000000000'),
    } as any;
    const fees = (await service.getPoolFees(pair, pool as any)) as any;
    // protocolFee is non-zero and expressed in permill (denominator = 1_000_000)
    expect(fees.protocolFee[0]).toBeGreaterThan(0);
    expect(fees.protocolFee[1]).toBe(1_000_000);
    // min/max bounds are still present
    expect(fees.min).toBeDefined();
    expect(fees.max).toBeDefined();
    expect(fees.maxSlipFee).toEqual([20, 1_000_000]);
  });

  it('should throw for an unsupported pool type', async () => {
    const pool = { type: 'Unsupported' as any };
    const pair: PoolPair = { assetIn: 2, assetOut: 0 } as any;
    await expect(service.getPoolFees(pair, pool as any)).rejects.toThrow();
  });
});

// ── OfflinePoolUtils.fromPersistentDataToDataSource ───────────────────────────

describe('OfflinePoolUtils.fromPersistentDataToDataSource', () => {
  // Minimal raw persistent input — uses string IDs and plain numbers (pre-conversion)
  const baseInput: IPersistentDataInput = {
    assets: [
      {
        id: '5',
        decimals: 12,
        symbol: 'DOT',
        existentialDeposit: '1000',
        isSufficient: true,
        type: AssetType.Token,
      },
      {
        id: '0',
        decimals: 12,
        symbol: 'HDX',
        existentialDeposit: '500',
        isSufficient: true,
        type: AssetType.Token,
      },
    ],
    pools: {
      lbp: [],
      xyk: [
        {
          address: 'xyk_addr',
          type: PoolType.XYK,
          tokens: [
            {
              id: '5',
              decimals: 12,
              symbol: 'DOT',
              balance: '9000000000000',
              existentialDeposit: '1000',
              isSufficient: true,
              type: AssetType.Token,
              tradable: 15,
            },
            {
              id: '0',
              decimals: 12,
              symbol: 'HDX',
              balance: '3000000000000',
              existentialDeposit: '500',
              isSufficient: true,
              type: AssetType.Token,
              tradable: 15,
            },
          ],
          maxInRatio: 3,
          maxOutRatio: 3,
          minTradingLimit: 1000,
        },
      ],
      stableswap: [],
      omnipool: [
        {
          address: 'omni_addr',
          type: PoolType.Omni,
          tokens: [
            {
              id: '5',
              decimals: 12,
              symbol: 'DOT',
              existentialDeposit: '1000',
              isSufficient: true,
              type: AssetType.Token,
              balance: '9000000000000',
              hubReserves: '2000000000000',
              shares: '3000000000000',
              cap: '4000000000000',
              protocolShares: '500000000000',
              tradable: 15,
            },
          ],
          maxInRatio: 3,
          maxOutRatio: 3,
          minTradingLimit: 1000,
          hubAssetId: '1',
          maxSlipFee: 20,
        },
      ],
      aave: [],
    },
    constants: MOCK_CONSTANTS,
    emaOracle: [],
    mmOracle: [],
    meta: { paraBlockNumber: 1000, paraBlockHash: 'hash', relayBlockNumber: 1000 },
  };

  // ── Type conversions ──────────────────────────────────────────────────────

  it('should convert XYK pool token IDs from string to number', () => {
    const ds = OfflinePoolUtils.fromPersistentDataToDataSource(baseInput);
    expect(typeof ds.pools.xyk[0].tokens[0].id).toBe('number');
    expect(ds.pools.xyk[0].tokens[0].id).toBe(5);
    expect(ds.pools.xyk[0].tokens[1].id).toBe(0);
  });

  it('should convert XYK pool token balances from string to bigint', () => {
    const ds = OfflinePoolUtils.fromPersistentDataToDataSource(baseInput);
    expect(typeof ds.pools.xyk[0].tokens[0].balance).toBe('bigint');
    expect(ds.pools.xyk[0].tokens[0].balance).toBe(9_000_000_000_000n);
    expect(ds.pools.xyk[0].tokens[1].balance).toBe(3_000_000_000_000n);
  });

  it('should convert XYK pool token existentialDeposit from string to bigint', () => {
    const ds = OfflinePoolUtils.fromPersistentDataToDataSource(baseInput);
    expect(ds.pools.xyk[0].tokens[0].existentialDeposit).toBe(1000n);
    expect(ds.pools.xyk[0].tokens[1].existentialDeposit).toBe(500n);
  });

  it('should convert XYK pool ratio limits from number to bigint', () => {
    const ds = OfflinePoolUtils.fromPersistentDataToDataSource(baseInput);
    const pool = ds.pools.xyk[0];
    expect(pool.maxInRatio).toBe(3n);
    expect(pool.maxOutRatio).toBe(3n);
    expect(pool.minTradingLimit).toBe(1000n);
  });

  it('should convert OmniPool hubAssetId from string to number', () => {
    const ds = OfflinePoolUtils.fromPersistentDataToDataSource(baseInput);
    expect(typeof ds.pools.omnipool[0].hubAssetId).toBe('number');
    expect(ds.pools.omnipool[0].hubAssetId).toBe(1);
  });

  it('should convert OmniPool token numeric fields to bigint', () => {
    const ds = OfflinePoolUtils.fromPersistentDataToDataSource(baseInput);
    const token = ds.pools.omnipool[0].tokens[0] as any;
    expect(token.hubReserves).toBe(2_000_000_000_000n);
    expect(token.shares).toBe(3_000_000_000_000n);
    expect(token.cap).toBe(4_000_000_000_000n);
    expect(token.protocolShares).toBe(500_000_000_000n);
  });

  it('should convert OmniPool token ID from string to number', () => {
    const ds = OfflinePoolUtils.fromPersistentDataToDataSource(baseInput);
    expect(typeof ds.pools.omnipool[0].tokens[0].id).toBe('number');
    expect(ds.pools.omnipool[0].tokens[0].id).toBe(5);
  });

  it('should preserve meta data as-is', () => {
    const ds = OfflinePoolUtils.fromPersistentDataToDataSource(baseInput);
    expect(ds.meta).toEqual(baseInput.meta);
  });

  it('should set maxSlipFee from first omnipool entry', () => {
    const ds = OfflinePoolUtils.fromPersistentDataToDataSource(baseInput);
    expect(ds.extras.omnipool.maxSlipFee).toBe(20);
  });

  it('should default maxSlipFee to 0 when omnipool list is empty', () => {
    const ds = OfflinePoolUtils.fromPersistentDataToDataSource({
      ...baseInput,
      pools: { ...baseInput.pools, omnipool: [] },
    });
    expect(ds.extras.omnipool.maxSlipFee).toBe(0);
  });

  // ── Validation errors ─────────────────────────────────────────────────────

  it('should throw if assets list is empty', () => {
    expect(() =>
      OfflinePoolUtils.fromPersistentDataToDataSource({
        ...baseInput,
        assets: [],
      })
    ).toThrow('Assets list can not be empty');
  });

  it('should throw if constants are missing', () => {
    expect(() =>
      OfflinePoolUtils.fromPersistentDataToDataSource({
        ...baseInput,
        constants: undefined as any,
      })
    ).toThrow('Constants must be provided');
  });

  it('should throw if meta is missing', () => {
    expect(() =>
      OfflinePoolUtils.fromPersistentDataToDataSource({
        ...baseInput,
        meta: undefined as any,
      })
    ).toThrow('Datasource metadata must be provided');
  });

  it('should throw if emaOracle is missing', () => {
    expect(() =>
      OfflinePoolUtils.fromPersistentDataToDataSource({
        ...baseInput,
        emaOracle: undefined as any,
      })
    ).toThrow('EmaOracle data must be provided');
  });
});
