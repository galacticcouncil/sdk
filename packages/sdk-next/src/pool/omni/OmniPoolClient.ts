import { AccountId, CompatibilityLevel } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { type Observable, distinctUntilChanged, map } from 'rxjs';

import { PoolType, PoolLimits, PoolFees } from '../types';
import { PoolClient } from '../PoolClient';

import { HUB_ASSET_ID, HYDRATION_SS58_PREFIX } from '../../consts';
import { fmt } from '../../utils';

import { OmniPoolBase, OmniPoolFees, OmniPoolToken } from './OmniPool';

export class OmniPoolClient extends PoolClient<OmniPoolBase> {
  protected async loadPools(): Promise<OmniPoolBase[]> {
    const hubAssetId = await this.api.constants.Omnipool.HubAssetId();
    const poolAddress = this.getPoolAddress();

    const [
      entries,
      hubAssetTradeability,
      hubAssetMeta,
      hubAssetBalance,
      limits,
    ] = await Promise.all([
      this.api.query.Omnipool.Assets.getEntries(),
      this.api.query.Omnipool.HubAssetTradability.getValue(),
      this.api.query.AssetRegistry.Assets.getValue(hubAssetId),
      this.getBalance(poolAddress, hubAssetId),
      this.getPoolLimits(),
    ]);

    const poolTokens = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const { hub_reserve, shares, tradable, cap, protocol_shares } = value;

      const [meta, balance] = await Promise.all([
        this.api.query.AssetRegistry.Assets.getValue(id),
        this.getBalance(poolAddress, id),
      ]);

      return {
        id: id,
        decimals: meta?.decimals,
        existentialDeposit: meta?.existential_deposit,
        balance: balance,
        cap: cap,
        hubReserves: hub_reserve,
        protocolShares: protocol_shares,
        shares: shares,
        tradeable: tradable,
        type: meta?.asset_type.type,
      } as OmniPoolToken;
    });

    const tokens = await Promise.all(poolTokens);

    // Adding LRNA info
    tokens.push({
      id: hubAssetId,
      decimals: hubAssetMeta?.decimals,
      existentialDeposit: hubAssetMeta?.existential_deposit,
      balance: hubAssetBalance,
      tradeable: hubAssetTradeability,
      type: hubAssetMeta?.asset_type.type,
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

  private getPoolAddress() {
    const name = 'modlomnipool'.padEnd(32, '\0');

    const nameU8a = new TextEncoder().encode(name);
    const nameHex = toHex(nameU8a);

    return AccountId(HYDRATION_SS58_PREFIX).dec(nameHex);
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

  async getPoolFees(_pool: OmniPoolBase, feeAsset: number): Promise<PoolFees> {
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
        assetFee: fmt.fromPermill(asset_fee),
        protocolFee: fmt.fromPermill(protocol_fee),
        min: fmt.fromPermill(min),
        max: fmt.fromPermill(max),
      } as OmniPoolFees;
    } else {
      return {
        assetFee: fmt.fromPermill(afp.min_fee),
        protocolFee: fmt.fromPermill(pfp.min_fee),
        min: fmt.fromPermill(min),
        max: fmt.fromPermill(max),
      } as OmniPoolFees;
    }
  }

  getPoolType(): PoolType {
    return PoolType.Omni;
  }

  async isSupported(): Promise<boolean> {
    const query = this.api.query.Omnipool.Assets;
    const compatibilityToken = await this.api.compatibilityToken;
    return query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken
    );
  }

  subscribePoolChange(pool: OmniPoolBase): Observable<OmniPoolBase> {
    const query = this.api.query.Omnipool.Assets;
    return query
      .watchEntries({
        at: 'best',
      })
      .pipe(
        distinctUntilChanged((_, current) => !current.deltas),
        map(({ deltas, entries }) => {
          const delta = deltas?.upserted.map((up) => up.args).sort();
          this.logSync(pool.address, 'pool assets', delta);
          return entries.map((e) => {
            const [key] = e.args;
            const { hub_reserve, shares, tradable, cap, protocol_shares } =
              e.value;

            const tokenIndex = pool.tokens.findIndex((t) => t.id === key);
            const token = pool.tokens[tokenIndex];
            return {
              ...token,
              cap: cap,
              hubReserves: hub_reserve,
              protocolShares: protocol_shares,
              shares: shares,
              tradeable: tradable,
            } as OmniPoolToken;
          });
        }),
        map((tokens) => {
          const lrna = pool.tokens.find((t) => t.id === HUB_ASSET_ID);
          return {
            ...pool,
            tokens: [...tokens, lrna!],
          };
        })
      );
  }
}
