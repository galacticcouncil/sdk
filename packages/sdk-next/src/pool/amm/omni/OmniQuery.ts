import { TEmaOracle, TEmaPair } from '../../../oracle';

import { PoolLimits } from '../../types';
import { PoolQuery } from '../../PoolQuery';

import { ORACLE_NAME, ORACLE_PERIOD } from './consts';
import {
  TAssetFeeParams,
  TDynamicFees,
  TDynamicFeesConfig,
  TOmnipoolAsset,
  TProtocolFeeParams,
  TSlipFee,
} from './types';

/**
 * Omnipool reads.
 *
 * - An asset's reserve is a plain balance of the pool account; the rest of its
 *   slice (hub reserve, shares, cap, tradability) is its `Assets` entry
 * - Fee inputs are event-authoritative: a trade or an oracle update writes the
 *   fresh value, a config change clears it
 */
export class OmniQuery extends PoolQuery {
  /** Every asset's state */
  readonly assetStates = this.cache.scope(
    'Omnipool.Assets.entries',
    (at) => this.api.query.Omnipool.Assets.getEntries({ at }),
    () => 'entries',
    'block'
  );

  /** One asset's state */
  readonly assetState = this.cache.scope<[number], TOmnipoolAsset | undefined>(
    'Omnipool.Assets',
    (at, id) => this.api.query.Omnipool.Assets.getValue(id, { at }),
    (id) => String(id),
    'block'
  );

  /** Hub asset tradable state */
  readonly hubTradability = this.cache.scope(
    'Omnipool.HubAssetTradability',
    (at) => this.api.query.Omnipool.HubAssetTradability.getValue({ at }),
    () => 'hubTradability',
    'block'
  );

  /** Per-asset fee config; governance change, read lazily */
  readonly dynamicFeesConfig = this.cache.scope<
    [number],
    TDynamicFeesConfig | undefined
  >(
    'DynamicFees.AssetFeeConfiguration',
    (at, id) =>
      this.api.query.DynamicFees.AssetFeeConfiguration.getValue(id, { at }),
    (id) => String(id),
    'persistent'
  );

  /** Per-asset dynamic fee, recomputed on-chain per trade */
  readonly dynamicFees = this.cache.scope<[number], TDynamicFees | undefined>(
    'DynamicFees.AssetFee',
    (at, id) => this.api.query.DynamicFees.AssetFee.getValue(id, { at }),
    (id) => String(id),
    'block'
  );

  /** Slip fee cap */
  readonly maxSlipFee = this.cache.scope<[], TSlipFee | undefined>(
    'Omnipool.SlipFee',
    (at) => this.api.query.Omnipool.SlipFee.getValue({ at }),
    () => 'slipFee',
    'persistent'
  );

  /** Short-period EMA entry of an asset's hub pair */
  readonly emaOracles = this.cache.scope<[TEmaPair], TEmaOracle | undefined>(
    'EmaOracle.Oracles.Short',
    (at, pair) =>
      this.api.query.EmaOracle.Oracles.getValue(
        ORACLE_NAME,
        pair,
        ORACLE_PERIOD,
        { at }
      ),
    (pair) => pair.join(':'),
    'block'
  );

  hubAssetId(): Promise<number> {
    return this.api.constants.Omnipool.HubAssetId();
  }

  assetFeeParams(): Promise<TAssetFeeParams> {
    return this.api.constants.DynamicFees.AssetFeeParameters();
  }

  protocolFeeParams(): Promise<TProtocolFeeParams> {
    return this.api.constants.DynamicFees.ProtocolFeeParameters();
  }

  async limits(): Promise<PoolLimits> {
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
