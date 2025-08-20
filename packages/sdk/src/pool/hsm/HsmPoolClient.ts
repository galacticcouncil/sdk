import type { ApiPromise } from '@polkadot/api';
import type { Vec } from '@polkadot/types';
import type {
  PalletHsmCollateralInfo,
  FrameSystemEventRecord,
} from '@polkadot/types/lookup';

import { UnsubscribePromise } from '@polkadot/api-base/types';
import { stringToU8a } from '@polkadot/util';
import { encodeAddress } from '@polkadot/util-crypto';

import { decodeEventLog } from 'viem';

import { HYDRADX_SS58_PREFIX } from '../../consts';
import { EvmClient, EvmLogEvent } from '../../evm';
import { GHO_TOKEN_ABI, GhoTokenClient } from '../../gho';
import { bnum } from '../../utils/bignumber';
import { FeeUtils } from '../../utils/fee';
import { H160 } from '../../utils/h160';
import { findNestedKey } from '../../utils/json';

import { StableSwapClient } from '../stable';
import { PoolType, PoolPair, PoolFees, PoolBase } from '../types';

import { PoolClient } from '../PoolClient';
import { HsmPoolBase } from './HsmPool';

const SYNC_BUCKET_EVENTS = [
  'FacilitatorBucketCapacityUpdated',
  'FacilitatorBucketLevelUpdated',
];

export class HsmClient extends PoolClient {
  private stableClient: StableSwapClient;
  private ghoTokenClient: GhoTokenClient;

  constructor(api: ApiPromise, evm: EvmClient, stableClient: StableSwapClient) {
    super(api, evm);
    this.stableClient = stableClient;
    this.ghoTokenClient = new GhoTokenClient(evm);
  }

  getPoolType(): PoolType {
    return PoolType.HSM;
  }

  private getPoolId(poolId: string): string {
    const id = 'hsm:' + poolId;
    return encodeAddress(stringToU8a(id.padEnd(32, '\0')), HYDRADX_SS58_PREFIX);
  }

  private getFacilitatorAddress(): string {
    return encodeAddress(
      stringToU8a('modlpy/hsmod'.padEnd(32, '\0')),
      HYDRADX_SS58_PREFIX
    );
  }

  private getHollarAddress(hollarLocation: any): string {
    const accountKey20 = findNestedKey(hollarLocation, 'accountKey20');
    return accountKey20['accountKey20'].key;
  }

  isSupported(): boolean {
    return this.api.query.hsm !== undefined;
  }

  async loadPools(): Promise<PoolBase[]> {
    const hollarId = this.api.consts.hsm.hollarId.toString();
    const [hollarLocation, collaterals, stablePools] = await Promise.all([
      this.api.query.assetRegistry.assetLocations(hollarId),
      this.api.query.hsm.collaterals.entries(),
      this.stableClient.getPoolsMem(),
    ]);

    if (collaterals.length === 0) {
      return [];
    }

    const facilitator = this.getFacilitatorAddress();
    const facilitatorH160 = H160.fromAny(facilitator);
    const hollarH160 = this.getHollarAddress(hollarLocation.unwrap());

    const hsmMintCapacity = await this.ghoTokenClient.getFacilitatorCapacity(
      hollarH160,
      facilitatorH160
    );

    const pools = collaterals.map(
      async ([
        {
          args: [id],
        },
        state,
      ]) => {
        const collateralInfo: PalletHsmCollateralInfo = state.unwrap();
        const collateralId = id.toString();

        const {
          poolId,
          maxBuyPriceCoefficient,
          maxInHolding,
          purchaseFee,
          buyBackFee,
          buybackRate,
        } = collateralInfo;

        const stablePool = stablePools.find((p) => p.id === poolId.toString());
        if (stablePool) {
          const address = this.getPoolId(poolId.toString());
          const collateralBalance = await this.getBalance(
            facilitator,
            collateralId
          );

          return {
            ...stablePool,
            address: address,
            type: PoolType.HSM,
            tokens: stablePool.tokens.filter((t) => t.id !== poolId.toString()),
            hsmAddress: facilitator,
            hsmMintCapacity: bnum(hsmMintCapacity),
            hollarId: hollarId,
            hollarH160: hollarH160,
            collateralId: collateralId,
            collateralBalance: collateralBalance,
            maxBuyPriceCoefficient: bnum(maxBuyPriceCoefficient.toString()),
            maxInHolding: bnum(maxInHolding.unwrap().toString()),
            purchaseFee: FeeUtils.fromPermill(purchaseFee.toNumber()),
            buyBackFee: FeeUtils.fromPermill(buyBackFee.toNumber()),
            buyBackRate: FeeUtils.fromPerbill(buybackRate.toNumber()),
          } as PoolBase;
        }
      }
    );
    const results = await Promise.all(pools);
    return results.filter((pool): pool is PoolBase => pool !== null);
  }

  async getPoolFees(
    _block: number,
    _poolPair: PoolPair,
    _poolAddress: string
  ): Promise<PoolFees> {
    return {} as PoolFees;
  }

  protected onEvents(events: Vec<FrameSystemEventRecord>): void {
    events.forEach(async (record) => {
      const { event } = record;
      const eventKey = `${event.section}:${event.method}`;

      if (eventKey === 'evm:Log') {
        const [log] = event.data.toJSON() as EvmLogEvent;
        try {
          const { eventName, args } = decodeEventLog({
            abi: GHO_TOKEN_ABI,
            topics: log.topics,
            data: log.data,
          });

          const [hsmPool] = this.pools;
          const { hsmAddress, hollarH160 } = hsmPool as HsmPoolBase;
          const facilitatorH160 = H160.fromAny(hsmAddress);

          const isHsmFacilitatorSync =
            facilitatorH160.toLowerCase() ===
            args.facilitatorAddress.toLowerCase();

          if (SYNC_BUCKET_EVENTS.includes(eventName) && isHsmFacilitatorSync) {
            const hsmMintCapacity =
              await this.ghoTokenClient.getFacilitatorCapacity(
                hollarH160,
                facilitatorH160
              );

            this.log(
              `Sync HSM facilitator via [evm:Log] :: ${eventName} ${hsmMintCapacity}`
            );
            this.pools.forEach((p) => {
              Object.assign(p, { hsmMintCapacity: hsmMintCapacity });
            });
          }
        } catch (e) {}
      }
    });
  }

  protected async subscribeBalances(): UnsubscribePromise {
    const unsub = this.pools.map(async (pool: PoolBase) => {
      const { collateralId, hsmAddress, tokens } = pool as HsmPoolBase;

      const collateral = tokens.find((t) => t.id === collateralId)!;
      const collateralBalanceCb = (balances: [string, BigNumber][]) => {
        const [collateral] = balances;
        const [_id, balance] = collateral;
        Object.assign(pool, { collateralBalance: balance });
      };

      if (collateral.type === 'Erc20') {
        return this.subscribeErc20Balance(hsmAddress, collateralBalanceCb, [
          collateralId,
        ]);
      }
      return this.subscribeTokenBalance(hsmAddress, collateralBalanceCb, [
        collateralId,
      ]);
    });

    const unsubFns = await Promise.all(unsub);
    return () => {
      for (const unsub of unsubFns.flat()) {
        try {
          unsub();
        } catch (e) {
          console.warn('Balance unsub failed', e);
        }
      }
    };
  }

  protected async subscribeUpdates(): UnsubscribePromise {
    return () => {};
  }
}
