import { AccountId, CompatibilityLevel, PolkadotClient } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { h160, HYDRATION_SS58_PREFIX } from '@galacticcouncil/common';

import { BlockAt } from '../../../api';
import { EvmClient } from '../../../evm';
import { GhoTokenLog, GhoTokenClient } from '../../../gho';
import { XcmV3Multilocation } from '../../../types';
import { fmt } from '../../../utils';

import { BlockRef, PoolEventHandler, PoolMutation } from '../../events';
import { PoolBase, PoolFees, PoolType } from '../../types';
import { PoolClient } from '../../PoolClient';

import { StableSwapBase, StableSwapClient } from '../stable';

import { HsmPoolBase } from './HsmPool';

const { FeeUtils } = fmt;
const { H160 } = h160;

const SYNC_BUCKET_EVENTS = [
  'FacilitatorBucketCapacityUpdated',
  'FacilitatorBucketLevelUpdated',
];

export class HsmPoolClient extends PoolClient<HsmPoolBase> {
  private ghoClient: GhoTokenClient;
  private stableClient: StableSwapClient;

  /** Last merged source pool per id; identity check for the per-block merge */
  private merged = new Map<number, StableSwapBase>();

  constructor(
    client: PolkadotClient,
    evm: EvmClient,
    stableClient: StableSwapClient,
    at?: BlockAt
  ) {
    super(client, evm, at);
    this.stableClient = stableClient;
    this.ghoClient = new GhoTokenClient(evm);
  }

  getPoolType(): PoolType {
    return PoolType.HSM;
  }

  private getPoolId(poolId: number): string {
    return this.getPoolAddress('hsm:' + poolId);
  }

  private getFacilitatorAddress(): string {
    return this.getPoolAddress('modlpy/hsmod');
  }

  private getHollarAddress(location: XcmV3Multilocation | undefined): string {
    if (location) {
      const interior = location.interior;
      if (interior.type === 'X1' && interior.value.type === 'AccountKey20') {
        const { value } = interior.value;
        return value.key;
      }
    }
    throw Error('Invalid hollar multilocation');
  }

  private getPoolAddress(seed: string) {
    const name = seed.padEnd(32, '\0');
    const nameU8a = new TextEncoder().encode(name);
    const nameHex = toHex(nameU8a);
    return AccountId(HYDRATION_SS58_PREFIX).dec(nameHex);
  }

  async isSupported(): Promise<boolean> {
    const staticApis = await this.api.getStaticApis();
    return staticApis.compat.query.HSM.Collaterals.isCompatible(
      CompatibilityLevel.BackwardsCompatible
    );
  }

  async loadPools(at: BlockAt): Promise<HsmPoolBase[]> {
    const hollarId = await this.api.constants.HSM.HollarId();

    const [hollarLocation, collaterals, stablePools] = await Promise.all([
      this.api.query.AssetRegistry.AssetLocations.getValue(hollarId, {
        at,
      }),
      this.api.query.HSM.Collaterals.getEntries({ at }),
      this.stableClient.getPools(at),
    ]);

    if (collaterals.length === 0) {
      return [];
    }

    const facilitator = this.getFacilitatorAddress();
    const facilitatorH160 = H160.fromAny(facilitator);
    const hollarH160 = this.getHollarAddress(hollarLocation);

    const hsmMintCapacity = await this.ghoClient.getFacilitatorCapacity(
      hollarH160,
      facilitatorH160
    );

    const pools = collaterals.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;

      const {
        pool_id,
        max_buy_price_coefficient,
        max_in_holding,
        purchase_fee,
        buy_back_fee,
        buyback_rate,
      } = value;

      const stablePool = stablePools.find((p) => p.id === pool_id);
      if (stablePool) {
        const address = this.getPoolId(pool_id);
        const collateralBalance = await this.balance.getBalanceAt(
          facilitator,
          id,
          at
        );

        return {
          ...stablePool,
          address: address,
          type: PoolType.HSM,
          tokens: stablePool.tokens.filter((t) => t.id !== pool_id),
          hsmAddress: facilitator,
          hsmMintCapacity: hsmMintCapacity,
          hollarId: hollarId,
          hollarH160: hollarH160,
          collateralId: id,
          collateralBalance: collateralBalance.transferable,
          maxBuyPriceCoefficient: max_buy_price_coefficient,
          maxInHolding: max_in_holding,
          purchaseFee: FeeUtils.fromPermill(purchase_fee),
          buyBackFee: FeeUtils.fromPermill(buy_back_fee),
          buyBackRate: FeeUtils.fromPerbill(buyback_rate),
        } as PoolBase;
      }
    });
    const results = await Promise.all(pools);
    return results.filter((pool): pool is HsmPoolBase => pool !== null);
  }

  async getPoolFees(): Promise<PoolFees> {
    return {} as PoolFees;
  }

  // =============================================================================
  // Handlers
  // =============================================================================

  protected syncHandlers(): PoolEventHandler<HsmPoolBase>[] {
    return [this.syncCollateralHandler(), this.syncMintCapacityHandler()];
  }

  /**
   * Collateral reserve — unified `Broadcast.Swapped` (method `Swapped3`) filled
   * by HSM (buy/sell/arbitrage moves the facilitator's collateral).
   *
   * - Re-read the traded pools' collateral balance at the facilitator
   * - Pinned at the event's block
   */
  private syncCollateralHandler(): PoolEventHandler<HsmPoolBase> {
    return {
      match: (e) =>
        e.pallet === 'Broadcast' &&
        e.method === 'Swapped3' &&
        e.data?.filler_type?.type === 'HSM',
      resolve: (e, block) => {
        const ids = new Set<number>();
        for (const io of [
          ...(e.data.inputs ?? []),
          ...(e.data.outputs ?? []),
        ]) {
          ids.add(io.asset);
        }
        const affected = this.store.pools.filter((p) =>
          ids.has(p.collateralId)
        );
        if (affected.length > 0) {
          this.log.trace('collateral', { assets: [...ids] });
        }
        return this.collateralMutations([...ids], block.hash);
      },
    };
  }

  /**
   * Mint capacity — GHO facilitator bucket `EVM.Log` (capacity/level updated).
   *
   * - Re-read the facilitator capacity when the HSM facilitator's bucket moves
   * - Patch `hsmMintCapacity` across all pools
   */
  private syncMintCapacityHandler(): PoolEventHandler<HsmPoolBase> {
    return {
      match: (e) => e.pallet === 'EVM' && e.method === 'Log',
      resolve: async (e) => {
        const ev = GhoTokenLog.parse(e.data);
        if (!ev || !SYNC_BUCKET_EVENTS.includes(ev.eventName)) return [];

        const pools = this.store.pools;
        if (pools.length === 0) return [];

        const [{ hsmAddress, hollarH160 }] = pools;
        const facilitatorH160 = H160.fromAny(hsmAddress);
        if (facilitatorH160.toLowerCase() !== ev.facilitator) return [];

        this.log.trace('capacity', { event: ev.eventName });
        const hsmMintCapacity = await this.ghoClient.getFacilitatorCapacity(
          hollarH160,
          facilitatorH160
        );
        return pools.map((pool) => ({
          address: pool.address,
          apply: (p) => ({ ...p, hsmMintCapacity }),
        }));
      },
    };
  }

  // =============================================================================
  // Reconcile
  // =============================================================================

  /**
   * Periodic reconcile — re-read erc20 collateral held at the facilitator.
   *
   * - Stableswap reserves stay fresh via the sibling snapshot merge
   * - Only erc20 collateral accrues with no event, so reconcile just those
   */
  protected reconcileBalances(
    block: BlockRef
  ): Promise<PoolMutation<HsmPoolBase>[]> {
    const ids = new Set<number>();
    for (const pool of this.store.pools) {
      const collateral = pool.tokens.find((t) => t.id === pool.collateralId);
      if (collateral?.type === 'Erc20') {
        ids.add(pool.collateralId);
      }
    }
    if (ids.size === 0) return Promise.resolve([]);
    return this.collateralMutations([...ids], block.hash);
  }

  // =============================================================================
  // Mutations
  // =============================================================================

  /**
   * Re-read collateral balances at the facilitator, PINNED at `at` (the event's
   * block hash).
   *
   * - One mutation per affected pool (collateral in the trade's assets)
   */
  private async collateralMutations(
    assetIds: number[],
    at: string
  ): Promise<PoolMutation<HsmPoolBase>[]> {
    const pools = this.store.pools;
    if (pools.length === 0) return [];

    const [{ hsmAddress }] = pools;
    const affected = pools.filter((p) => assetIds.includes(p.collateralId));

    return Promise.all(
      affected.map(async (pool) => {
        const balance = await this.balance.getBalanceAt(
          hsmAddress,
          pool.collateralId,
          at
        );
        return {
          address: pool.address,
          apply: (p: HsmPoolBase) => ({
            ...p,
            collateralBalance: balance.transferable,
          }),
        };
      })
    );
  }

  // =============================================================================
  // Snapshot sync
  // =============================================================================

  /**
   * Derived from the stableswap pool backing each collateral.
   *
   * - The driver commits this pool's block after stableswap's, so the merge
   *   below always reads stableswap state AT that block
   */
  dependencies(): StableSwapClient[] {
    return [this.stableClient];
  }

  /**
   * Merge the underlying stableswap pool's coherent slice.
   *
   * - Reference identity is the "did my source change" test: `PoolStore`
   *   replaces only the pools it touched, leaving the rest as the same object
   * - Nothing changed upstream ⇒ no mutations ⇒ no commit, no emission
   */
  protected async tickMutations(): Promise<PoolMutation<HsmPoolBase>[]> {
    const muts: PoolMutation<HsmPoolBase>[] = [];

    for (const pool of this.store.pools) {
      const stablePool = this.stableClient.pools.find((s) => s.id === pool.id);
      if (!stablePool || this.merged.get(pool.id) === stablePool) continue;
      this.merged.set(pool.id, stablePool);

      muts.push({
        address: pool.address,
        apply: (p) => ({
          ...p,
          fee: stablePool.fee,
          tokens: stablePool.tokens.filter((t) => t.id !== p.id),
          totalIssuance: stablePool.totalIssuance,
          pegs: stablePool.pegs,
          amplification: stablePool.amplification,
          isRampPeriod: stablePool.isRampPeriod,
        }),
      });
    }

    return muts;
  }
}
