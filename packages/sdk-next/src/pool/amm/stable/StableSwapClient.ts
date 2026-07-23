import { AccountId, CompatibilityLevel } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { blake2b } from '@noble/hashes/blake2b';

import {
  HYDRATION_SS58_PREFIX,
  RUNTIME_DECIMALS,
} from '@galacticcouncil/common';

import {
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
  PoolPair,
} from '../../types';
import { PoolClient } from '../../PoolClient';
import {
  BlockRef,
  PoolEventEffect,
  PoolEventHandler,
  PoolMutation,
} from '../../events';

import { TRADEABLE_DEFAULT } from '../../../consts';
import { fmt, QueryBus } from '../../../utils';

import {
  DIA_MM_BY_KEY,
  HYBRID_MM_BY_EMA,
  HYBRID_MM_BY_EMITTER,
  MmOracleLog,
  MmOracleClient,
  MmOracleEntry,
  emaRouteKey,
  emaKey,
  TEmaName,
  TEmaOracle,
  TEmaPair,
  TEmaPeriod,
} from '../../../oracle';

import { StableMath } from './StableMath';
import { StableSwapBase, StableSwapFees } from './StableSwap';
import { StableSwapPeg } from './StableSwapPeg';
import { TPegLatest, TStableswap, TStableswapPeg } from './types';

const { FeeUtils } = fmt;

export class StableSwapClient extends PoolClient<StableSwapBase> {
  protected poolsData: Map<number, TStableswap> = new Map([]);

  private emaKeys: Set<string> = new Set();
  private mmOracle = new MmOracleClient(this.evm);
  private mmAddresses: Set<string> = new Set();
  private mmRouting = {
    byEmitter: new Map<string, string>(),
    byDiaKey: new Map<string, string>(),
    byEma: new Map<string, string>(),
  };

  private queryBus = new QueryBus();

  private emaOracles = this.queryBus.scope<
    [TEmaName, TEmaPair, TEmaPeriod],
    TEmaOracle | undefined
  >(
    'EmaOracle.Oracles',
    (name, pair, period) =>
      this.api.query.EmaOracle.Oracles.getValue(name, pair, period, {
        at: this.at,
      }),
    (name, pair, period) =>
      `${name.toString()}:${pair.join(':')}:${period.type}`,
    6 * 1000
  );

  private mmOracles = this.queryBus.scope<[string], MmOracleEntry>(
    'MmOracle',
    (h160) => this.mmOracle.getData(h160),
    (h160) => h160.toLowerCase(),
    10 * 60 * 1000
  );

  private pegs = this.queryBus.scope<[number], TStableswapPeg | undefined>(
    'Stableswap.PoolPegs',
    (id) => this.api.query.Stableswap.PoolPegs.getValue(id, { at: this.at }),
    (id) => String(id),
    6 * 1000
  );

  getPoolType(): PoolType {
    return PoolType.Stable;
  }

  private getPoolAddress(poolId: number) {
    const name = StableMath.getPoolAddress(poolId);
    const blake2 = blake2b(name, { dkLen: 32 });
    const blake2Hex = toHex(blake2);
    return AccountId(HYDRATION_SS58_PREFIX).dec(blake2Hex);
  }

  private async getPoolLimits(): Promise<PoolLimits> {
    const minTradingLimit =
      await this.api.constants.Stableswap.MinTradingLimit();

    return {
      maxInRatio: 0n,
      maxOutRatio: 0n,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }

  private getPoolAmplification(
    poolInfo: TStableswap,
    blockNumber: number
  ): Pick<StableSwapBase, 'amplification' | 'isRampPeriod'> {
    const {
      initial_amplification,
      final_amplification,
      initial_block,
      final_block,
    } = poolInfo;

    const amplification = StableMath.calculateAmplification(
      initial_amplification.toString(),
      final_amplification.toString(),
      initial_block.toString(),
      final_block.toString(),
      blockNumber.toString()
    );

    const isRampPeriod = Number(amplification) < final_amplification;
    return {
      amplification: BigInt(amplification),
      isRampPeriod: isRampPeriod,
    } as Pick<StableSwapBase, 'amplification' | 'isRampPeriod'>;
  }

  private async getPoolTokens(
    poolId: number,
    poolInfo: TStableswap
  ): Promise<PoolToken[]> {
    const poolAddress = this.getPoolAddress(poolId);
    const poolTokens = poolInfo.assets.map(async (id) => {
      const [tradeability, meta, balance] = await Promise.all([
        this.api.query.Stableswap.AssetTradability.getValue(poolId, id, {
          at: this.at,
        }),
        this.api.query.AssetRegistry.Assets.getValue(id, { at: this.at }),
        this.balance.getBalance(poolAddress, id),
      ]);

      return {
        id: id,
        decimals: meta?.decimals,
        existentialDeposit: meta?.existential_deposit,
        balance: balance.transferable,
        tradeable: tradeability,
        type: meta?.asset_type.type,
      } as PoolToken;
    });

    return Promise.all(poolTokens);
  }

  /**
   * Builds MM-event → mmAddress lookup maps
   */
  private buildRouting() {
    this.mmRouting.byEmitter.clear();
    this.mmRouting.byDiaKey.clear();
    this.mmRouting.byEma.clear();

    // Managed direct: emitter is itself the mmAddress.
    for (const mm of this.mmAddresses) {
      this.mmRouting.byEmitter.set(mm, mm);
    }

    // Hybrid: wrapped Managed emitter → hybrid mmAddress.
    for (const [emitter, hybridMm] of Object.entries(HYBRID_MM_BY_EMITTER)) {
      const e = emitter.toLowerCase();
      const m = hybridMm.toLowerCase();
      if (this.mmAddresses.has(m)) this.mmRouting.byEmitter.set(e, m);
    }

    // DIA wrapper: OracleUpdate key → mmAddress.
    for (const [key, mm] of Object.entries(DIA_MM_BY_KEY)) {
      const m = mm.toLowerCase();
      if (this.mmAddresses.has(m)) this.mmRouting.byDiaKey.set(key, m);
    }

    // Hybrid EMA leg: `${source}:${pairA}:${pairB}` → hybrid mmAddress.
    for (const [key, mm] of Object.entries(HYBRID_MM_BY_EMA)) {
      const m = mm.toLowerCase();
      if (this.mmAddresses.has(m)) this.mmRouting.byEma.set(key, m);
    }
  }

  /**
   * Cache each pool's peg config and index its oracle inputs:
   *
   * - MM addresses for routing
   * - EMA `name:pair:period` keys the pegs reference
   */
  private indexPegs(
    pegs: { keyArgs: [number]; value: TStableswapPeg }[],
    assetsByPool: Map<number, number[]>
  ) {
    this.emaKeys.clear();

    for (const { keyArgs, value } of pegs) {
      const [id] = keyArgs;
      const assets = assetsByPool.get(id) ?? [];
      value.source.forEach((s, i) => {
        if (s.type === 'MMOracle') {
          const mmAddress = s.value.toString().toLowerCase();
          this.mmAddresses.add(mmAddress);
        }

        if (s.type === 'Oracle') {
          const [name, period, oracleAsset] = s.value as [
            TEmaName,
            TEmaPeriod,
            number,
          ];
          const pair = [oracleAsset, assets[i]].sort((a, b) => a - b) as [
            number,
            number,
          ];
          const key = emaKey(name, pair, period);
          this.emaKeys.add(key);
        }
      });
      this.pegs.set(value, id);
    }
  }

  async isSupported(): Promise<boolean> {
    const staticApis = await this.api.getStaticApis();
    return staticApis.compat.query.Stableswap.Pools.isCompatible(
      CompatibilityLevel.BackwardsCompatible
    );
  }

  protected async loadPools(): Promise<StableSwapBase[]> {
    const [pools, pegs, block, poolLimits] = await Promise.all([
      this.api.query.Stableswap.Pools.getEntries({ at: this.at }),
      this.api.query.Stableswap.PoolPegs.getEntries({ at: this.at }),
      this.api.query.System.Number.getValue({ at: this.at }),
      this.getPoolLimits(),
    ]);

    const assetsByPool = new Map(
      pools.map(({ keyArgs, value }) => [keyArgs[0], value.assets])
    );

    this.indexPegs(pegs, assetsByPool);
    this.buildRouting();

    const entries = pools.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const address = this.getPoolAddress(id);
      const [tokens, amplification, pegs, issuance] = await Promise.all([
        this.getPoolTokens(id, value),
        this.getPoolAmplification(value, block),
        this.getPoolPegs(id, value, block),
        this.api.query.Tokens.TotalIssuance.getValue(id, { at: this.at }),
      ]);

      // add virtual share (routing)
      tokens.push({
        id: id,
        tradeable: TRADEABLE_DEFAULT,
        balance: issuance,
        decimals: RUNTIME_DECIMALS,
      } as PoolToken);

      this.poolsData.set(id, value);
      return {
        address: address,
        id: id,
        type: PoolType.Stable,
        fee: FeeUtils.fromPermill(value.fee),
        tokens: tokens,
        totalIssuance: issuance,
        ...pegs,
        ...poolLimits,
        ...amplification,
      } as StableSwapBase;
    });

    return Promise.all(entries);
  }

  async getPoolFees(_pair: PoolPair, address: string): Promise<PoolFees> {
    const pool = this.store.pools.find(
      (pool) => pool.address === address
    ) as StableSwapBase;

    return {
      fee: pool.fee as PoolFee,
    } as StableSwapFees;
  }

  private async getPoolPegs(
    poolId: number,
    pool: TStableswap,
    blockNumber: number
  ) {
    const poolPegs = await this.pegs.get(poolId);
    if (!poolPegs) {
      return StableSwapPeg.getDefault(pool);
    }
    const latest = await this.getLatestPegs(pool, poolPegs, blockNumber);
    return StableSwapPeg.compute(pool, poolPegs, latest, blockNumber);
  }

  private async getLatestPegs(
    pool: TStableswap,
    poolPegs: TStableswapPeg,
    blockNumber: number
  ): Promise<TPegLatest[]> {
    const { source } = poolPegs;
    const assets = pool.assets;

    const latest = source.map(async (s, i) => {
      if (s.type === 'Oracle') {
        const [name, period, oracleAsset] = s.value as [
          TEmaName,
          TEmaPeriod,
          number,
        ];
        const oracleKey = [oracleAsset, assets[i]].sort((a, b) => a - b) as [
          number,
          number,
        ];
        const entry = await this.emaOracles.get(name, oracleKey, period);
        if (!entry) {
          throw new Error('EmaOracle missing for ' + name + ' / ' + oracleKey);
        }
        const [{ price, updated_at }] = entry;
        const pair =
          oracleAsset === oracleKey[0]
            ? [price.n.toString(), price.d.toString()]
            : [price.d.toString(), price.n.toString()];
        return { pair, updatedAt: updated_at.toString(), source: s.type };
      }

      if (s.type === 'MMOracle') {
        const h160 = s.value.toString();
        const { price, decimals, updatedAt } = await this.mmOracles.get(h160);
        const priceDenom = (10n ** BigInt(decimals)).toString();
        const pair = [price.toString(), priceDenom];
        return { pair, updatedAt: updatedAt.toString(), source: s.type };
      }

      if (s.type === 'Value') {
        const pair = (s.value as [bigint, bigint]).map((p) => p.toString());
        return { pair, updatedAt: blockNumber.toString() };
      }

      throw new Error(s + ' source not supported');
    });

    return Promise.all(latest);
  }

  // =============================================================================
  // Handlers
  // =============================================================================

  protected syncHandlers(): PoolEventHandler<StableSwapBase>[] {
    return [
      this.syncTradeHandler(),
      this.syncLiquidityHandler(),
      this.syncFeeHandler(),
      this.syncTradableHandler(),
    ];
  }

  /**
   * Trades — unified `Broadcast.Swapped` (method `Swapped3`) where the filler is
   * a stableswap pool (`filler_type = Stableswap`, value = pool id). Recompute
   * the reserves of the in/out assets, pinned at the event's block. Issuance is
   * unchanged by a swap.
   */
  private syncTradeHandler(): PoolEventHandler<StableSwapBase> {
    return {
      match: (e) =>
        e.pallet === 'Broadcast' &&
        e.method === 'Swapped3' &&
        e.data?.filler_type?.type === 'Stableswap',
      resolve: (e, block) => {
        const poolId = e.data.filler_type.value as number;
        const ids = new Set<number>();
        for (const io of [
          ...(e.data.inputs ?? []),
          ...(e.data.outputs ?? []),
        ]) {
          ids.add(io.asset);
        }
        return this.stableReserveMutations(poolId, [...ids], block.hash, false);
      },
    };
  }

  /**
   * Liquidity add/remove — recompute the touched assets' reserves AND the pool's
   * total issuance (the virtual share balance), pinned at the event's block.
   */
  private syncLiquidityHandler(): PoolEventHandler<StableSwapBase> {
    return {
      match: (e) =>
        e.pallet === 'Stableswap' &&
        (e.method === 'LiquidityAdded' || e.method === 'LiquidityRemoved'),
      resolve: (e, block) => {
        const poolId = e.data.pool_id as number;
        const legs = (e.data.assets ?? e.data.amounts ?? []) as {
          asset_id: number;
        }[];
        const ids = legs.map((a) => a.asset_id);
        return this.stableReserveMutations(poolId, ids, block.hash, true);
      },
    };
  }

  /**
   * Fee change — field patch from the payload; also refresh the cached pool
   * data so the tick's peg recompute uses the new fee.
   */
  private syncFeeHandler(): PoolEventHandler<StableSwapBase> {
    return {
      match: (e) => e.pallet === 'Stableswap' && e.method === 'FeeUpdated',
      resolve: async (e) => {
        const poolId = e.data.pool_id as number;
        const data = this.poolsData.get(poolId);
        if (data) {
          this.poolsData.set(poolId, { ...data, fee: e.data.fee });
        }
        return [
          {
            address: this.getPoolAddress(poolId),
            apply: (pool) => ({
              ...pool,
              fee: FeeUtils.fromPermill(e.data.fee),
            }),
          },
        ];
      },
    };
  }

  /**
   * Per-asset tradable state — field patch, no read.
   */
  private syncTradableHandler(): PoolEventHandler<StableSwapBase> {
    return {
      match: (e) =>
        e.pallet === 'Stableswap' && e.method === 'TradableStateUpdated',
      resolve: async (e) => {
        const { pool_id, asset_id, state } = e.data;
        return [
          {
            address: this.getPoolAddress(pool_id as number),
            apply: (pool) => ({
              ...pool,
              tokens: pool.tokens.map((t) =>
                t.id === asset_id ? { ...t, tradeable: state } : t
              ),
            }),
          },
        ];
      },
    };
  }

  // =============================================================================
  // Effects
  // =============================================================================

  protected syncEffects(): PoolEventEffect[] {
    return [
      this.syncAmplificationEffect(),
      this.syncStructuralEffect(),
      this.syncPegEffect(),
      this.syncPegSourceEffect(),
      this.syncEmaOracleEffect(),
      this.syncEmaHybridMmEffect(),
      this.syncMmOracleEffect(),
    ];
  }

  /**
   * Amplification ramp scheduled — store the new ramp params; the tick
   * interpolates `amplification` each block until `final_block`.
   */
  private syncAmplificationEffect(): PoolEventEffect {
    return {
      match: (e) =>
        e.pallet === 'Stableswap' && e.method === 'AmplificationChanging',
      apply: async (e) => {
        const poolId = e.data.pool_id as number;
        const data = this.poolsData.get(poolId);
        if (data) {
          this.poolsData.set(poolId, {
            ...data,
            initial_amplification: e.data.current_amplification,
            final_amplification: e.data.final_amplification,
            initial_block: e.data.start_block,
            final_block: e.data.end_block,
          });
        }
      },
    };
  }

  /**
   * Pool created/destroyed — composition change; full reseed (v1).
   */
  private syncStructuralEffect(): PoolEventEffect {
    return {
      match: (e) =>
        e.pallet === 'Stableswap' &&
        (e.method === 'PoolCreated' || e.method === 'PoolDestroyed'),
      apply: async () => {
        this.requestResync();
      },
    };
  }

  /**
   * Peg cache (trade) — `PoolPegs` `current`/`updated_at` move when the pool is
   * traded; refresh it at the event's block. The tick projects from it.
   */
  private syncPegEffect(): PoolEventEffect {
    return {
      match: (e) =>
        e.pallet === 'Broadcast' &&
        e.method === 'Swapped3' &&
        e.data?.filler_type?.type === 'Stableswap',
      apply: async (e, block) => {
        const poolId = e.data.filler_type.value as number;
        const cfg = await this.api.query.Stableswap.PoolPegs.getValue(poolId, {
          at: block.hash,
        });
        if (cfg) {
          this.pegs.set(cfg, poolId);
        }
      },
    };
  }

  /**
   * Peg cache (governance) — a pool's peg source/rate config changed; refresh it
   * at the event's block.
   */
  private syncPegSourceEffect(): PoolEventEffect {
    return {
      match: (e) =>
        e.pallet === 'Stableswap' &&
        (e.method === 'PoolPegSourceUpdated' ||
          e.method === 'PoolMaxPegUpdateUpdated'),
      apply: async (e, block) => {
        const poolId = e.data.pool_id as number;
        const cfg = await this.api.query.Stableswap.PoolPegs.getValue(poolId, {
          at: block.hash,
        });
        if (cfg) {
          this.pegs.set(cfg, poolId);
        }
      },
    };
  }

  /**
   * EMA oracle cache — read + cache the entries a pool peg references. The event
   * names the (source, pair) and the periods that moved; keep only the wanted
   * periods and read them in one `getValues` at the event's block.
   */
  private syncEmaOracleEffect(): PoolEventEffect {
    return {
      match: (e) => e.pallet === 'EmaOracle' && e.method === 'OracleUpdated',
      apply: async (e, block) => {
        const name = e.data.source as TEmaName;
        const pair = e.data.assets as TEmaPair;
        const periods = (e.data.updates as [TEmaPeriod, unknown][])
          .map(([p]) => p)
          .filter((p) => this.emaKeys.has(emaKey(name, pair, p)));

        if (!periods.length) return;

        const keys = periods.map(
          (p) => [name, pair, p] as [TEmaName, TEmaPair, TEmaPeriod]
        );
        const entries = await this.api.query.EmaOracle.Oracles.getValues(keys, {
          at: block.hash,
        });

        periods.forEach((period, i) => {
          const entry = entries[i];
          if (entry) {
            this.emaOracles.set(entry, name, pair, period);
          }
        });
      },
    };
  }

  /**
   * Hybrid MM refresh — a Managed oracle whose EMA leg (`byEma`) just moved;
   * re-read it. Separate concern from the direct EMA cache above.
   */
  private syncEmaHybridMmEffect(): PoolEventEffect {
    return {
      match: (e) => e.pallet === 'EmaOracle' && e.method === 'OracleUpdated',
      apply: async (e) => {
        const name = e.data.source as TEmaName;
        const pair = e.data.assets as TEmaPair;
        const periods = (e.data.updates as [TEmaPeriod, unknown][]).map(
          ([p]) => p
        );

        const targets = new Set<string>();
        for (const period of periods) {
          const mmEmaKey = emaRouteKey(name, pair, period.type);
          const mm = this.mmRouting.byEma.get(mmEmaKey);
          if (mm) {
            targets.add(mm);
          }
        }
        for (const h160 of targets) {
          const data = await this.mmOracle.getData(h160);
          this.mmOracles.set(data, h160);
        }
      },
    };
  }

  /**
   * Managed/DIA oracle cache — the `EVM.Log` events (already in the event
   * stream) that carry MM price updates; refresh the routed MM oracle.
   */
  private syncMmOracleEffect(): PoolEventEffect {
    return {
      match: (e) => e.pallet === 'EVM' && e.method === 'Log',
      apply: async (e) => {
        const ev = MmOracleLog.parse(e.data);

        if (!ev) return;

        let target: string | undefined;
        if (ev.eventName === 'ManagedOracle.PriceUpdated') {
          target = this.mmRouting.byEmitter.get(ev.emitter);
        }

        if (ev.eventName === 'DIA.OracleUpdate' && ev.key) {
          target = this.mmRouting.byDiaKey.get(ev.key);
        }

        if (target) {
          const data = await this.mmOracle.getData(target);
          this.mmOracles.set(data, target);
        }
      },
    };
  }

  // =============================================================================
  // Mutations
  // =============================================================================

  /**
   * Resolve a pool's reserve slice for the given assets, PINNED at `at` (the
   * event's block hash). Optionally re-reads `Tokens.TotalIssuance` (the virtual
   * share token's balance) for liquidity events. One mutation per pool address.
   */
  private async stableReserveMutations(
    poolId: number,
    assetIds: number[],
    at: string,
    withIssuance: boolean
  ): Promise<PoolMutation<StableSwapBase>[]> {
    const address = this.getPoolAddress(poolId);
    const [balances, issuance] = await Promise.all([
      Promise.all(
        assetIds.map(async (id) => ({
          id,
          balance: (await this.balance.getBalanceAt(address, id, at))
            .transferable,
        }))
      ),
      withIssuance
        ? this.api.query.Tokens.TotalIssuance.getValue(poolId, { at })
        : Promise.resolve(undefined),
    ]);

    return [
      {
        address,
        apply: (pool) => {
          const tokens = pool.tokens.map((t) => {
            // the virtual share token tracks total issuance
            if (t.id === poolId) {
              return issuance !== undefined ? { ...t, balance: issuance } : t;
            }
            const b = balances.find((x) => x.id === t.id);
            return b ? { ...t, balance: b.balance } : t;
          });
          return issuance !== undefined
            ? { ...pool, tokens, totalIssuance: issuance }
            : { ...pool, tokens };
        },
      },
    ];
  }

  /**
   * Pegs & amp recalc.
   *
   * - `amplification` interpolates every block during a ramp
   * - `pegs` converge toward a moving oracle target each block
   *
   * Recompute is pure/cheap (WASM over already-cached params + oracles, no chain
   * read)
   */
  protected async tickMutations(
    block: BlockRef
  ): Promise<PoolMutation<StableSwapBase>[]> {
    const muts: PoolMutation<StableSwapBase>[] = [];
    for (const pool of this.store.pools) {
      const data = this.poolsData.get(pool.id);
      if (data) {
        const pegs = await this.getPoolPegs(pool.id, data, block.number);
        const amplification = this.getPoolAmplification(data, block.number);
        muts.push({
          address: pool.address,
          apply: (p) => ({ ...p, ...pegs, ...amplification }),
        });
      }
    }
    return muts;
  }
}
