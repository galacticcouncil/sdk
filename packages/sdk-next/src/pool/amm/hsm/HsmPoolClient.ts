import { AccountId, CompatibilityLevel, PolkadotClient } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { Subscription } from 'rxjs';

import { h160, HYDRATION_SS58_PREFIX } from '@galacticcouncil/common';

import { BlockAt } from '../../../api';
import { EvmClient } from '../../../evm';
import { GhoTokenLog, GhoTokenClient } from '../../../gho';
import { XcmV3Multilocation } from '../../../types';
import { fmt } from '../../../utils';

import { PoolEventHandler, PoolMutation } from '../../events';
import { PoolBase, PoolFees, PoolType } from '../../types';
import { PoolClient } from '../../PoolClient';

import { StableSwapClient } from '../stable';

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

  async loadPools(): Promise<HsmPoolBase[]> {
    const hollarId = await this.api.constants.HSM.HollarId();

    const [hollarLocation, collaterals, stablePools] = await Promise.all([
      this.api.query.AssetRegistry.AssetLocations.getValue(hollarId, {
        at: this.at,
      }),
      this.api.query.HSM.Collaterals.getEntries({ at: this.at }),
      this.stableClient.getPools(),
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
        const collateralBalance = await this.balance.getBalance(
          facilitator,
          id
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

  private subscribeStableswapUpdates(): Subscription {
    return this.stableClient
      .getSubscriber()
      .pipe(this.watchGuard('stableswap.updates'))
      .subscribe((stablePools) => {
        const stableMap = new Map(stablePools.map((p) => [p.id, p]));

        this.store.update((hsmPools) => {
          const updated: HsmPoolBase[] = [];

          for (const hsmPool of hsmPools) {
            const stablePool = stableMap.get(hsmPool.id);
            if (stablePool) {
              updated.push({
                ...hsmPool,
                // Merge updated stableswap properties
                fee: stablePool.fee,
                tokens: stablePool.tokens.filter((t) => t.id !== hsmPool.id),
                totalIssuance: stablePool.totalIssuance,
                pegs: stablePool.pegs,
                amplification: stablePool.amplification,
                isRampPeriod: stablePool.isRampPeriod,
              });
            }
          }
          return updated;
        });
      });
  }

  /**
   * Merge the underlying stableswap pool's coherent snapshot.
   *
   * - Runs alongside the event driver (disjoint fields)
   * - Keeps fee/tokens/issuance/pegs/amplification in sync
   */
  protected subscribeUpdates(): Subscription {
    return this.subscribeStableswapUpdates();
  }
}
