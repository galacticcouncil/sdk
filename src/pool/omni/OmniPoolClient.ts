import type { StorageKey } from '@polkadot/types';
import type { PalletOmnipoolAssetState } from '@polkadot/types/lookup';
import type { AnyTuple } from '@polkadot/types/types';
import type { Option } from '@polkadot/types-codec';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';
import { HYDRADX_SS58_PREFIX } from '../../consts';
import { bnum } from '../../utils/bignumber';
import { toPoolFee } from '../../utils/mapper';
import { PoolBase, PoolType, PoolFee, PoolToken, PoolLimits, PoolFees } from '../../types';

import { OmniPoolFees, OmniPoolToken } from './OmniPool';

import { PoolClient } from '../PoolClient';

export class OmniPoolClient extends PoolClient {
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
    const poolAssets = await this.api.query.omnipool.assets.entries();
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
      hubAssetId: hubAssetId,
      tokens: poolTokensState,
      ...this.getPoolLimits(),
    } as PoolBase;
  }

  private async syncPool(): Promise<PoolBase> {
    const hubAssetId = this.api.consts.omnipool.hubAssetId.toString();
    const poolAssets = await this.api.query.omnipool.assets.entries();
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

  async getPoolFees(feeAsset: string, _address: string): Promise<PoolFees> {
    const dynamicFees = await this.getDynamicFees(feeAsset);
    if (dynamicFees && dynamicFees.isSome) {
      const { assetFee, protocolFee } = dynamicFees.unwrap();
      const afp = this.api.consts.dynamicFees.assetFeeParameters;
      const pfp = this.api.consts.dynamicFees.protocolFeeParameters;
      const min = afp.minFee.toNumber() + pfp.minFee.toNumber();
      const max = afp.maxFee.toNumber() + pfp.maxFee.toNumber();

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
      } as OmniPoolFees;
    }
  }

  private getAssetFee(): PoolFee {
    let assetFeeNo: number;
    try {
      const assetFee = this.api.consts.dynamicFees.assetFeeParameters;
      assetFeeNo = assetFee.minFee.toNumber();
    } catch {
      // TODO: Remove fallback when dyn fees pallet on mainnet
      const assetFee = this.api.consts.omnipool.assetFee;
      assetFeeNo = assetFee.toJSON() as number;
    }
    return toPoolFee(assetFeeNo);
  }

  private getProtocolFee(): PoolFee {
    let protocolFeeNo: number;
    try {
      const protocolFee = this.api.consts.dynamicFees.protocolFeeParameters;
      protocolFeeNo = protocolFee.minFee.toNumber();
    } catch {
      // TODO: Remove fallback when dyn fees pallet on mainnet
      const protocolFee = this.api.consts.omnipool.protocolFee;
      protocolFeeNo = protocolFee.toJSON() as number;
    }
    return toPoolFee(protocolFeeNo);
  }

  private getDynamicFees(asset: string) {
    try {
      return this.api.query.dynamicFees.assetFee(asset);
    } catch {
      // TODO: Remove fallback when dyn fees pallet on mainnet
      return null;
    }
  }

  private getPoolId(): string {
    return encodeAddress(stringToU8a('modlomnipool'.padEnd(32, '\0')), HYDRADX_SS58_PREFIX);
  }

  private getPoolLimits(): PoolLimits {
    const maxInRatio = this.api.consts.omnipool.maxInRatio.toJSON() as number;
    const maxOutRatio = this.api.consts.omnipool.maxOutRatio.toJSON() as number;
    const minTradingLimit = this.api.consts.omnipool.minimumTradingLimit.toJSON() as number;
    return { maxInRatio: maxInRatio, maxOutRatio: maxOutRatio, minTradingLimit: minTradingLimit } as PoolLimits;
  }
}
