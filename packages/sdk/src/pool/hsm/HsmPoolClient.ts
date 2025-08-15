import type { PalletHsmCollateralInfo } from '@polkadot/types/lookup';
import { ApiPromise } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';

import { HYDRADX_SS58_PREFIX } from '../../consts';
import { EvmClient } from '../../evm';
import { bnum } from '../../utils/bignumber';
import { FeeUtils } from '../../utils/fee';

import { PoolType, PoolPair, PoolFees, PoolBase } from '../types';
import { StableSwapClient } from '../stable';
import { PoolClient } from '../PoolClient';
import { HsmPoolBase } from './HsmPool';

export class HsmClient extends PoolClient {
  private stableClient: StableSwapClient;

  constructor(api: ApiPromise, evm: EvmClient, stableClient: StableSwapClient) {
    super(api, evm);
    this.stableClient = stableClient;
  }

  getPoolType(): PoolType {
    return PoolType.HSM;
  }

  private getPoolId(poolId: string): string {
    const id = 'hsm:' + poolId;
    return encodeAddress(stringToU8a(id.padEnd(32, '\0')), HYDRADX_SS58_PREFIX);
  }

  isSupported(): boolean {
    return this.api.query.hsm !== undefined;
  }

  async loadPools(): Promise<PoolBase[]> {
    const [hollarId, collaterals, stablePools] = await Promise.all([
      this.api.consts.hsm.hollarId.toString(),
      this.api.query.hsm.collaterals.entries(),
      this.stableClient.getPoolsMem(),
    ]);

    const pools = collaterals.map(([{}, state]) => {
      const collateralInfo: PalletHsmCollateralInfo = state.unwrap();

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
        return {
          ...stablePool,
          address: address,
          type: PoolType.HSM,
          tokens: stablePool.tokens.filter((t) => t.id !== poolId.toString()),
          hollarId: hollarId,
          maxBuyPriceCoefficient: bnum(maxBuyPriceCoefficient.toString()),
          maxInHolding: bnum(maxInHolding.unwrap().toString()),
          purchaseFee: FeeUtils.fromPermill(purchaseFee.toNumber()),
          buyBackFee: FeeUtils.fromPermill(buyBackFee.toNumber()),
          buyBackRate: FeeUtils.fromPerbill(buybackRate.toNumber()),
        } as PoolBase;
      }
    });
    return pools.filter((pool): pool is PoolBase => pool !== null);
  }

  async getPoolFees(
    _block: number,
    _poolPair: PoolPair,
    _poolAddress: string
  ): Promise<PoolFees> {
    return {} as PoolFees;
  }

  protected async subscribeBalances(): UnsubscribePromise {
    return () => {};
  }

  protected async subscribeUpdates(): UnsubscribePromise {
    return () => {};
  }
}
