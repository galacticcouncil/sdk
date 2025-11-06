import { AccountId, CompatibilityLevel, PolkadotClient } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import {
  Observable,
  Subscription,
  combineLatest,
  filter,
  finalize,
  map,
  pairwise,
} from 'rxjs';
import { decodeEventLog } from 'viem';

import { PoolClient } from '../PoolClient';
import { StableSwapClient } from '../stable';
import { PoolBase, PoolFees, PoolType } from '../types';

import { EvmClient } from '../../evm';
import { GHO_TOKEN_ABI, GhoTokenClient } from '../../gho';
import { AssetBalance, XcmV3Multilocation } from '../../types';
import { h160, HYDRATION_SS58_PREFIX } from '@galacticcouncil/common';
import { fmt } from '../../utils';

import { HsmPoolBase } from './HsmPool';
import { TEvmEvent, TEvmPayload } from './types';

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
    stableClient: StableSwapClient
  ) {
    super(client, evm);
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
        return value.key.asHex();
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
    const query = this.api.query.HSM.Collaterals;
    const compatibilityToken = await this.api.compatibilityToken;
    return query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken
    );
  }

  async loadPools(): Promise<HsmPoolBase[]> {
    const hollarId = await this.api.constants.HSM.HollarId();

    const [hollarLocation, collaterals, stablePools] = await Promise.all([
      this.api.query.AssetRegistry.AssetLocations.getValue(hollarId),
      this.api.query.HSM.Collaterals.getEntries({ at: 'best' }),
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
        const collateralBalance = await this.getBalance(facilitator, id);

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

  private parseEvmLog(payload: TEvmPayload): TEvmEvent | undefined {
    const { topics, data } = payload.log;
    const topicsHex = topics.map((t) => t.asHex());
    const dataHex = data.asHex();

    try {
      const { eventName, args } = decodeEventLog({
        abi: GHO_TOKEN_ABI,
        topics: topicsHex as any,
        data: dataHex as any,
      });

      const facilitator = args.facilitatorAddress.toLowerCase();

      return {
        eventName,
        facilitator,
        key: `${eventName}:${facilitator}`,
      };
    } catch {
      return undefined;
    }
  }

  private subscribeEvmLog(): Subscription {
    return this.api.event.EVM.Log.watch()
      .pipe(
        map(({ payload }) => this.parseEvmLog(payload)),
        filter((v): v is TEvmEvent => v !== undefined),
        filter(({ eventName }) => SYNC_BUCKET_EVENTS.includes(eventName)),
        finalize(() => {
          this.log(this.getPoolType(), 'unsub evm log');
        })
      )
      .subscribe(({ facilitator, key }) => {
        this.log(this.getPoolType(), '[evm:Log]', key);

        this.store.update(async (pools) => {
          const updated: HsmPoolBase[] = [];

          const [{ hsmAddress, hollarH160 }] = pools;

          const facilitatorH160 = H160.fromAny(hsmAddress);

          const isHsmFacilitatorSync =
            facilitatorH160.toLowerCase() === facilitator;

          if (isHsmFacilitatorSync) {
            const hsmMintCapacity = await this.ghoClient.getFacilitatorCapacity(
              hollarH160,
              facilitatorH160
            );
            for (const pool of pools) {
              updated.push({
                ...pool,
                hsmMintCapacity: hsmMintCapacity,
              });
            }
          }

          return updated;
        });
      });
  }

  protected override subscribeBalances(): Subscription {
    const tokenCollaterals: number[] = [];
    const erc20Collaterals: number[] = [];

    this.store.pools.forEach((pool) => {
      const { tokens, collateralId } = pool;
      const collateral = tokens.find((t) => t.id === collateralId)!;

      if (collateral.type === 'Erc20') {
        erc20Collaterals.push(collateralId);
      } else {
        tokenCollaterals.push(collateralId);
      }
    });

    const [{ hsmAddress }] = this.store.pools;

    const subs: Observable<AssetBalance[]>[] = [];

    if (tokenCollaterals.length > 0) {
      const tokenSub = this.subscribeTokensBalance(hsmAddress);
      subs.push(tokenSub);
    }

    if (erc20Collaterals.length > 0) {
      const erc20Sub = this.subscribeErc20Balance(hsmAddress, erc20Collaterals);
      subs.push(erc20Sub);
    }

    if (subs.length > 0) {
      return combineLatest(subs)
        .pipe(
          map((balance) => balance.flat()),
          pairwise(),
          map(([prev, curr]) => this.getDeltas(prev, curr)),
          finalize(() => {
            this.log(this.getPoolType(), 'unsub collateral balance');
          })
        )
        .subscribe((balances) => {
          this.store.update((pools) => {
            const updated: HsmPoolBase[] = [];
            const poolsMap = new Map(pools.map((p) => [p.collateralId, p]));

            balances.forEach(({ id, balance }) => {
              const pool = poolsMap.get(id);
              if (pool) {
                this.log(
                  this.getPoolType(),
                  '[collateral:Balance]',
                  id,
                  balance.transferable
                );
                updated.push({
                  ...pool,
                  collateralBalance: balance.transferable,
                });
              }
            });
            return updated;
          });
        });
    }
    return Subscription.EMPTY;
  }

  protected subscribeUpdates(): Subscription {
    const sub = new Subscription();

    sub.add(this.subscribeEvmLog());

    return sub;
  }
}
