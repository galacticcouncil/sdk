import type { PalletOmnipoolAssetState } from '@polkadot/types/lookup';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';
import { HYDRADX_SS58_PREFIX } from '../../consts';
import { bnum } from '../../utils/bignumber';
import { toPoolFee } from '../../utils/mapper';
import {
  PoolBase,
  PoolType,
  PoolFee,
  PoolToken,
  PoolLimits,
  PoolFees,
} from '../../types';

import { OmniPoolFees, OmniPoolToken } from './OmniPool';

import { PoolClient } from '../PoolClient';

export class OmniPoolClient extends PoolClient {
  isSupported(): boolean {
    return this.api.query.omnipool !== undefined;
  }

  async loadPools(): Promise<PoolBase[]> {
    const hubAssetId = this.api.consts.omnipool.hubAssetId.toString();
    const poolAddress = this.getPoolId();

    const [assets, hubAssetTradeability, hubAssetBalance] = await Promise.all([
      this.api.query.omnipool.assets.entries(),
      this.api.query.omnipool.hubAssetTradability(),
      this.getBalance(poolAddress, hubAssetId),
    ]);

    const poolTokens = assets.map(
      async ([
        {
          args: [id],
        },
        state,
      ]) => {
        const { hubReserve, shares, tradable }: PalletOmnipoolAssetState =
          state.unwrap();
        const balance = await this.getBalance(poolAddress, id.toString());
        return {
          id: id.toString(),
          hubReserves: bnum(hubReserve.toString()),
          shares: bnum(shares.toString()),
          tradeable: tradable.bits.toNumber(),
          balance: balance.toString(),
        } as OmniPoolToken;
      }
    );

    const tokens = await Promise.all(poolTokens);

    // Adding LRNA info
    tokens.push({
      id: hubAssetId,
      tradeable: hubAssetTradeability.bits.toNumber(),
      balance: hubAssetBalance.toString(),
    } as OmniPoolToken);

    return [
      {
        address: poolAddress,
        type: PoolType.Omni,
        hubAssetId: hubAssetId,
        tokens: tokens,
        ...this.getPoolLimits(),
      } as PoolBase,
    ];
  }

  async getPoolFees(feeAsset: string, _address: string): Promise<PoolFees> {
    const dynamicFees = await this.api.query.dynamicFees.assetFee(feeAsset);
    const afp = this.api.consts.dynamicFees.assetFeeParameters;
    const pfp = this.api.consts.dynamicFees.protocolFeeParameters;
    const min = afp.minFee.toNumber() + pfp.minFee.toNumber();
    const max = afp.maxFee.toNumber() + pfp.maxFee.toNumber();

    if (dynamicFees.isSome) {
      const { assetFee, protocolFee } = dynamicFees.unwrap();
      return {
        assetFee: toPoolFee(assetFee.toNumber()),
        protocolFee: toPoolFee(protocolFee.toNumber()),
        min: toPoolFee(min),
        max: toPoolFee(max),
      } as OmniPoolFees;
    } else {
      return {
        assetFee: this.getAssetFee(),
        protocolFee: this.getProtocolFee(),
        min: toPoolFee(min),
        max: toPoolFee(max),
      } as OmniPoolFees;
    }
  }

  getPoolType(): PoolType {
    return PoolType.Omni;
  }

  async subscribePoolChange(pool: PoolBase): UnsubscribePromise {
    const assetsArgs = pool.tokens.map((t) => t.id);
    return this.api.query.omnipool.assets.multi(assetsArgs, (states) => {
      pool.tokens = states.map((state, i) => {
        const token = pool.tokens[i];
        if (state.isNone) return token;
        const unwrapped: PalletOmnipoolAssetState = state.unwrap();
        return this.updateTokenState(token, unwrapped);
      });
    });
  }

  private updateTokenState(
    token: PoolToken,
    tokenState: PalletOmnipoolAssetState
  ) {
    const { hubReserve, shares, tradable } = tokenState;
    return {
      ...token,
      hubReserves: bnum(hubReserve.toString()),
      shares: bnum(shares.toString()),
      tradeable: tradable.bits.toNumber(),
    } as OmniPoolToken;
  }

  private getAssetFee(): PoolFee {
    const assetFee = this.api.consts.dynamicFees.assetFeeParameters;
    const assetFeeNo = assetFee.minFee.toNumber();
    return toPoolFee(assetFeeNo);
  }

  private getProtocolFee(): PoolFee {
    const protocolFee = this.api.consts.dynamicFees.protocolFeeParameters;
    const protocolFeeNo: number = protocolFee.minFee.toNumber();
    return toPoolFee(protocolFeeNo);
  }

  private getPoolId(): string {
    return encodeAddress(
      stringToU8a('modlomnipool'.padEnd(32, '\0')),
      HYDRADX_SS58_PREFIX
    );
  }

  private getPoolLimits(): PoolLimits {
    const maxInRatio = this.api.consts.omnipool.maxInRatio.toJSON() as number;
    const maxOutRatio = this.api.consts.omnipool.maxOutRatio.toJSON() as number;
    const minTradingLimit =
      this.api.consts.omnipool.minimumTradingLimit.toJSON() as number;
    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }
}
