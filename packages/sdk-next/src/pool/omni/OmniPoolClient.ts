import { CompatibilityLevel } from 'polkadot-api';

import { type Observable, map } from 'rxjs';

import { PoolType, PoolLimits, PoolFees } from '../types';
import { PoolClient } from '../PoolClient';

import { HYDRATION_OMNIPOOL_ADDRESS } from '../../consts';
import { fmt } from '../../utils';

import { OmniPoolBase, OmniPoolFees, OmniPoolToken } from './OmniPool';

export class OmniPoolClient extends PoolClient<OmniPoolBase> {
  async isSupported(): Promise<boolean> {
    const query = this.api.query.Omnipool.Assets;
    const compatibilityToken = await this.api.compatibilityToken;
    return query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken
    );
  }

  async loadPools(): Promise<OmniPoolBase[]> {
    const hubAssetId = await this.api.constants.Omnipool.HubAssetId();
    const poolAddress = this.getPoolId();

    const [entries, hubAssetTradeability, hubAssetBalance, limits] =
      await Promise.all([
        this.api.query.Omnipool.Assets.getEntries(),
        this.api.query.Omnipool.HubAssetTradability.getValue(),
        this.getBalance(poolAddress, hubAssetId),
        this.getPoolLimits(),
      ]);

    const poolTokens = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const { hub_reserve, shares, tradable, cap, protocol_shares } = value;
      const balance = await this.getBalance(poolAddress, id);
      return {
        id: id,
        hubReserves: hub_reserve,
        shares: shares,
        tradeable: tradable,
        balance: balance,
        cap: cap,
        protocolShares: protocol_shares,
      } as OmniPoolToken;
    });

    const tokens = await Promise.all(poolTokens);

    // Adding LRNA info
    tokens.push({
      id: hubAssetId,
      tradeable: hubAssetTradeability,
      balance: hubAssetBalance,
    } as OmniPoolToken);

    return [
      {
        address: poolAddress,
        type: PoolType.Omni,
        hubAssetId: hubAssetId,
        tokens: tokens,
        ...limits,
      } as OmniPoolBase,
    ];
  }

  async getPoolFees(_address: string, feeAsset: number): Promise<PoolFees> {
    const [afp, pfp, dynamicFees] = await Promise.all([
      this.api.constants.DynamicFees.AssetFeeParameters(),
      this.api.constants.DynamicFees.ProtocolFeeParameters(),
      this.api.query.DynamicFees.AssetFee.getValue(feeAsset),
    ]);

    const min = afp.min_fee + pfp.min_fee;
    const max = afp.max_fee + pfp.max_fee;

    if (dynamicFees) {
      const { asset_fee, protocol_fee } = dynamicFees;
      return {
        assetFee: fmt.toPoolFee(asset_fee),
        protocolFee: fmt.toPoolFee(protocol_fee),
        min: fmt.toPoolFee(min),
        max: fmt.toPoolFee(max),
      } as OmniPoolFees;
    } else {
      return {
        assetFee: fmt.toPoolFee(afp.min_fee),
        protocolFee: fmt.toPoolFee(pfp.min_fee),
        min: fmt.toPoolFee(min),
        max: fmt.toPoolFee(max),
      } as OmniPoolFees;
    }
  }

  getPoolType(): PoolType {
    return PoolType.Omni;
  }

  subscribePoolChange(pool: OmniPoolBase): Observable<OmniPoolBase> {
    const query = this.api.query.Omnipool.Assets;
    return query.watchEntries().pipe(
      map((assets) => {
        assets.entries.forEach((e) => {
          const [key] = e.args;
          const { hub_reserve, shares, tradable, cap, protocol_shares } =
            e.value;

          const tokenIndex = pool.tokens.findIndex((t) => (t.id = key));
          const token = pool.tokens[tokenIndex];
          pool.tokens[tokenIndex] = {
            ...token,
            hubReserves: hub_reserve,
            shares: shares,
            tradeable: tradable,
            cap: cap,
            protocolShares: protocol_shares,
          } as OmniPoolToken;
        });
        return pool;
      })
    );
  }

  private getPoolId(): string {
    return HYDRATION_OMNIPOOL_ADDRESS;
  }

  private async getPoolLimits(): Promise<PoolLimits> {
    const [maxInRatio, maxOutRatio, minTradingLimit] = await Promise.all([
      this.api.constants.Omnipool.MaxInRatio(),
      this.api.constants.Omnipool.MaxOutRatio(),
      this.api.constants.Omnipool.MinimumTradingLimit(),
    ]);

    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }
}
