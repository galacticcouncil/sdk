import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';
import { ApiPromise } from '@polkadot/api';
import { PolkadotApiClient } from '../../client';
import { PoolBase, PoolType, PoolFee, PoolToken, PoolLimits } from '../../types';
import { OmniPoolToken } from './omniPool';
import { bnum } from '../../utils/bignumber';
import { DENOMINATOR, HYDRADX_SS58_PREFIX } from '../../consts';

interface OmniAssetData {
  readonly hubReserve: number;
  readonly shares: number;
  readonly protocolShares: number;
}

export class OmniPolkadotApiClient extends PolkadotApiClient {
  private pools: PoolBase[] = [];
  private _poolLoaded = false;
  private hubAssetId: string;

  constructor(api: ApiPromise) {
    super(api);
    this.hubAssetId = this.api.consts.omnipool.hubAssetId.toString();
  }

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

  async loadPool(): Promise<PoolBase> {
    const poolAssets = await this.api.query.omnipool.assets.entries();
    const poolEntries = poolAssets
      .map((asset: [StorageKey<AnyTuple>, Codec]) => {
        return this.getStorageKey(asset, 0);
      })
      .concat(this.hubAssetId);
    const poolAddress = this.getPoolId();
    const poolTokens = await this.getPoolTokens(poolAddress, poolEntries);
    const poolTokensState = this.getPoolTokenState(poolAssets, poolTokens);
    return {
      address: poolAddress,
      type: PoolType.Omni,
      tradeFee: this.getTradeFee(),
      assetFee: this.getAssetFee(),
      protocolFee: this.getProtocolFee(),
      hubAssetId: this.hubAssetId,
      tokens: poolTokensState,
      ...this.getPoolLimits(),
    } as PoolBase;
  }

  async syncPool(): Promise<PoolBase> {
    const poolAssets = await this.api.query.omnipool.assets.entries();
    const poolTokens = await this.syncPoolTokens(this.pools[0].address, this.pools[0].tokens);
    const poolTokensState = this.getPoolTokenState(poolAssets, poolTokens);
    return {
      ...this.pools[0],
      tokens: poolTokensState,
    } as PoolBase;
  }

  private getPoolTokenState(poolAssets: [StorageKey<AnyTuple>, Codec][], poolTokens: PoolToken[]): PoolToken[] {
    return poolTokens.map((token: PoolToken, index: number) => {
      if (this.hubAssetId === token.id) {
        return token;
      }
      const assetData = poolAssets[index][1].toJSON() as unknown as OmniAssetData;
      return {
        ...token,
        hubReserves: bnum(assetData.hubReserve),
        shares: bnum(assetData.shares),
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
