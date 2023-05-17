import type { StorageKey } from '@polkadot/types';
import type { AnyTuple } from '@polkadot/types/types';
import type { Option, Struct, u128, u8 } from '@polkadot/types-codec';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';
import { DENOMINATOR, HYDRADX_SS58_PREFIX } from '../../consts';
import { bnum } from '../../utils/bignumber';
import { PoolBase, PoolType, PoolFee, PoolToken, PoolLimits } from '../../types';

import { OmniPoolToken } from './OmniPool';

import { PoolApiClient } from '../PoolApiClient';

interface PalletOmnipoolAssetState extends Struct {
  readonly hubReserve: u128;
  readonly shares: u128;
  readonly protocolShares: u128;
  readonly cap: u128;
  readonly tradable: PalletOmnipoolTradability;
}

interface PalletOmnipoolTradability extends Struct {
  readonly bits: u8;
}

export class OmniPoolApiClient extends PoolApiClient {
  private pools: PoolBase[] = [];
  private _poolLoaded = false;

  async getPools(): Promise<PoolBase[]> {
    if (this._poolLoaded) {
      const pool = await this.syncPool();
      this.pools = [pool];
    } else {
      const pool = await this.loadPool();
      this.pools = [pool];
      this._poolLoaded = true;
    }
    return this.pools;
  }

  private async loadPool(): Promise<PoolBase> {
    const hubAssetId = this.api.consts.omnipool.hubAssetId.toString();
    const poolAssets = await this.api.query.omnipool.assets.entries<Option<PalletOmnipoolAssetState>>();
    const poolEntries = poolAssets
      .map((asset: [StorageKey<AnyTuple>, Option<PalletOmnipoolAssetState>]) => {
        return this.getStorageKey(asset, 0);
      })
      .concat(hubAssetId);
    const poolAddress = this.getPoolId();
    const poolTokens = await this.getPoolTokens(poolAddress, poolEntries);
    const poolTokensState = this.getPoolTokenState(poolAssets, poolTokens, hubAssetId);
    return {
      address: poolAddress,
      type: PoolType.Omni,
      tradeFee: this.getTradeFee(),
      assetFee: this.getAssetFee(),
      protocolFee: this.getProtocolFee(),
      hubAssetId: hubAssetId,
      tokens: poolTokensState,
      ...this.getPoolLimits(),
    } as PoolBase;
  }

  private async syncPool(): Promise<PoolBase> {
    const hubAssetId = this.api.consts.omnipool.hubAssetId.toString();
    const poolAssets = await this.api.query.omnipool.assets.entries<Option<PalletOmnipoolAssetState>>();
    const poolTokens = await this.syncPoolTokens(this.pools[0].address, this.pools[0].tokens);
    const poolTokensState = this.getPoolTokenState(poolAssets, poolTokens, hubAssetId);
    return {
      ...this.pools[0],
      tokens: poolTokensState,
    } as PoolBase;
  }

  private getPoolTokenState(
    poolAssets: [StorageKey<AnyTuple>, Option<PalletOmnipoolAssetState>][],
    poolTokens: PoolToken[],
    hubAssetId: string
  ): PoolToken[] {
    return poolTokens.map((token: PoolToken, index: number) => {
      if (hubAssetId === token.id) {
        return token;
      }
      const assetData: Option<PalletOmnipoolAssetState> = poolAssets[index][1];
      const state = assetData.unwrap();
      return {
        ...token,
        hubReserves: bnum(state.hubReserve.toString()),
        shares: bnum(state.shares.toString()),
      } as OmniPoolToken;
    });
  }

  getTradeFee(): PoolFee {
    const assetFee = this.getAssetFee();
    const protocolFee = this.getProtocolFee();
    return [assetFee[0] + protocolFee[0], DENOMINATOR] as PoolFee;
  }

  getAssetFee(): PoolFee {
    const assetFee = this.api.consts.omnipool.assetFee;
    const assetFeeNo = assetFee.toJSON() as number;
    return [assetFeeNo / DENOMINATOR, DENOMINATOR] as PoolFee;
  }

  getProtocolFee(): PoolFee {
    const protocolFee = this.api.consts.omnipool.protocolFee;
    const protocolFeeNo = protocolFee.toJSON() as number;
    return [protocolFeeNo / DENOMINATOR, DENOMINATOR] as PoolFee;
  }

  getPoolId(): string {
    return encodeAddress(stringToU8a('modlomnipool'.padEnd(32, '\0')), HYDRADX_SS58_PREFIX);
  }

  getPoolLimits(): PoolLimits {
    const maxInRatio = this.api.consts.omnipool.maxInRatio.toJSON() as number;
    const maxOutRatio = this.api.consts.omnipool.maxOutRatio.toJSON() as number;
    const minTradingLimit = this.api.consts.omnipool.minimumTradingLimit.toJSON() as number;
    return { maxInRatio: maxInRatio, maxOutRatio: maxOutRatio, minTradingLimit: minTradingLimit } as PoolLimits;
  }
}
