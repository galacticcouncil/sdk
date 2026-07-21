import { HUB_ASSET_ID, SYSTEM_ASSET_ID } from '../consts';

import { LbpPoolBase } from './amm/lbp';
import {
  OmniPoolBase,
  OmniPoolFees,
  TAssetFeeParams,
  TDynamicFees,
  TEmaOracle,
  TProtocolFeeParams,
} from './amm/omni';
import { StableSwapBase } from './amm/stable';
import {
  SnapshotPoolCtx,
  SnapshotPoolCtxProvider,
} from './SnapshotPoolCtxProvider';
import { Pool, PoolBase, PoolFee, PoolPair, PoolType } from './types';

const FEE: PoolFee = [3, 1000];
const REPAY: PoolFee = [1, 100];

const ASSET_FEE_PARAMS: TAssetFeeParams = {
  min_fee: 2500,
  max_fee: 400000,
  decay: 100000n,
  amplification: 10000n,
} as unknown as TAssetFeeParams;

const PROTOCOL_FEE_PARAMS: TProtocolFeeParams = {
  min_fee: 500,
  max_fee: 50000,
  decay: 100000n,
  amplification: 10000n,
} as unknown as TProtocolFeeParams;

const DYNAMIC_FEE: TDynamicFees = {
  asset_fee: 3000,
  protocol_fee: 1000,
  timestamp: 100,
} as unknown as TDynamicFees;

const ZERO_ORACLE: TEmaOracle = [
  {
    price: { n: 1n, d: 1n },
    volume: { a_in: 0n, b_out: 0n, a_out: 0n, b_in: 0n },
    liquidity: { a: 1_000_000_000_000n, b: 1_000_000_000_000n },
    updated_at: 100,
  },
] as unknown as TEmaOracle;

const xykPool: PoolBase = {
  address: 'xyk_addr',
  type: PoolType.XYK,
  tokens: [],
  maxInRatio: 3n,
  maxOutRatio: 3n,
  minTradingLimit: 1000n,
};

const lbpPool: LbpPoolBase = {
  address: 'lbp_addr',
  type: PoolType.LBP,
  tokens: [],
  maxInRatio: 3n,
  maxOutRatio: 3n,
  minTradingLimit: 1000n,
  fee: FEE,
  repayFeeApply: false,
};

const stablePool: StableSwapBase = {
  address: 'stable_addr',
  id: 100,
  type: PoolType.Stable,
  tokens: [],
  maxInRatio: 3n,
  maxOutRatio: 3n,
  minTradingLimit: 1000n,
  amplification: 100n,
  isRampPeriod: false,
  fee: [4, 1000],
  totalIssuance: 1_000_000_000_000n,
  pegs: [['1', '1']],
};

const aavePool: PoolBase = {
  address: 'aave_addr',
  type: PoolType.Aave,
  tokens: [],
  maxInRatio: 3n,
  maxOutRatio: 3n,
  minTradingLimit: 1000n,
};

const omniPool: OmniPoolBase = {
  address: 'omni_addr',
  type: PoolType.Omni,
  tokens: [],
  maxInRatio: 3n,
  maxOutRatio: 3n,
  minTradingLimit: 1000n,
  hubAssetId: HUB_ASSET_ID,
};

const baseSnapshot: SnapshotPoolCtx = {
  block: 100,
  pools: {
    aave: [aavePool],
    xyk: [xykPool],
    lbp: [lbpPool],
    stable: [stablePool],
    omni: [omniPool],
  },
  states: {
    omni: {
      dynamicFees: [{ asset: 2, fee: DYNAMIC_FEE }],
      emaOracles: [
        { pair: [HUB_ASSET_ID, 2], oracle: ZERO_ORACLE },
        { pair: [SYSTEM_ASSET_ID, HUB_ASSET_ID], oracle: ZERO_ORACLE },
      ],
      assetFeeParams: ASSET_FEE_PARAMS,
      protocolFeeParams: PROTOCOL_FEE_PARAMS,
      maxSlipFee: 20,
    },
    xyk: {
      exchangeFee: [3, 1000],
    },
    lbp: {
      repayFee: REPAY,
    },
  },
};

const omniPair = (assetIn: number, assetOut: number): PoolPair =>
  ({
    assetIn,
    assetOut,
    decimalsIn: 12,
    decimalsOut: 12,
    balanceIn: 1_000_000_000_000n,
    balanceOut: 1_000_000_000_000n,
    assetInEd: 1000n,
    assetOutEd: 1000n,
  }) as PoolPair;

describe('SnapshotPoolCtxProvider', () => {
  describe('getPools', () => {
    it('flattens all pool types into a single list', async () => {
      const provider = new SnapshotPoolCtxProvider(baseSnapshot);
      const pools = await provider.getPools();
      expect(pools).toHaveLength(5);
      const types = new Set(pools.map((p) => p.type));
      expect(types).toEqual(
        new Set([
          PoolType.Aave,
          PoolType.XYK,
          PoolType.LBP,
          PoolType.Stable,
          PoolType.Omni,
        ])
      );
    });

    it('returns the same array reference each call (cached)', async () => {
      const provider = new SnapshotPoolCtxProvider(baseSnapshot);
      const a = await provider.getPools();
      const b = await provider.getPools();
      expect(a).toBe(b);
    });
  });

  describe('getPoolFees', () => {
    const provider = new SnapshotPoolCtxProvider(baseSnapshot);
    const pair = omniPair(2, 0);

    it('returns empty fees for Aave', async () => {
      const fees = await provider.getPoolFees(pair, aavePool as Pool);
      expect(fees).toEqual({});
    });

    it('returns exchangeFee from snapshot for XYK', async () => {
      const fees = await provider.getPoolFees(pair, xykPool as Pool);
      expect(fees).toEqual({ exchangeFee: [3, 1000] });
    });

    it('returns pool.fee + snapshot.lbp.repayFee for LBP', async () => {
      const fees = await provider.getPoolFees(pair, lbpPool as unknown as Pool);
      expect(fees).toEqual({ exchangeFee: FEE, repayFee: REPAY });
    });

    it('returns pool.fee for Stable', async () => {
      const fees = await provider.getPoolFees(
        pair,
        stablePool as unknown as Pool
      );
      expect(fees).toEqual({ fee: [4, 1000] });
    });

    it('returns zero protocol fee for Omnipool LRNA sell', async () => {
      const lrnaSellPair = omniPair(HUB_ASSET_ID, 2);
      const fees = (await provider.getPoolFees(
        lrnaSellPair,
        omniPool as unknown as Pool
      )) as OmniPoolFees;
      expect(fees.protocolFee).toEqual([0, 1_000_000]);
      expect(fees.maxSlipFee).toEqual([20, 1_000_000]);
      expect(fees.assetFee[0]).toBeGreaterThan(0);
    });

    it('returns non-zero protocol fee for Omnipool non-LRNA sell', async () => {
      const fees = (await provider.getPoolFees(
        pair,
        omniPool as unknown as Pool
      )) as OmniPoolFees;
      expect(fees.protocolFee[0]).toBeGreaterThan(0);
      expect(fees.protocolFee[1]).toBe(1_000_000);
      expect(fees.assetFee[0]).toBeGreaterThan(0);
    });

    it('throws PoolNotFound for unsupported pool type', async () => {
      const unknown = { type: 'Unsupported' } as unknown as Pool;
      await expect(provider.getPoolFees(pair, unknown)).rejects.toThrow();
    });
  });
});
