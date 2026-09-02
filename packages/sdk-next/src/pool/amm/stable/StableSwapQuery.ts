import {
  MmOracleClient,
  MmOracleEntry,
  TEmaName,
  TEmaOracle,
  TEmaPair,
  TEmaPeriod,
} from '../../../oracle';

import { ChainParams } from '../../../client';

import { PoolLimits } from '../../types';
import { PoolQuery } from '../../PoolQuery';

import { TStableswapPeg } from './types';

/** MM oracle re-read cadence; a price update refreshes it early */
const MM_ORACLE_TTL = 10 * 60 * 1000;

/**
 * Stableswap reads.
 *
 * - Reserves are plain balances of the pool account, keyed by pool address
 * - Peg config and both oracle families are event-authoritative: the tick
 *   projects from the cached value, an event replaces it
 */
export class StableSwapQuery extends PoolQuery {
  private params = new ChainParams(this.client);
  private mmOracle = new MmOracleClient(this.evm);

  /** Every pool's config (assets, fee, amplification ramp) */
  readonly pools = this.cache.scope(
    'Stableswap.Pools.entries',
    (at) => this.api.query.Stableswap.Pools.getEntries({ at }),
    () => 'entries',
    'block'
  );

  /** Every pool's peg config */
  readonly poolPegs = this.cache.scope(
    'Stableswap.PoolPegs.entries',
    (at) => this.api.query.Stableswap.PoolPegs.getEntries({ at }),
    () => 'entries',
    'block'
  );

  /** One pool's peg config (sources, current pegs, max update) */
  readonly pegs = this.cache.scope<[number], TStableswapPeg | undefined>(
    'Stableswap.PoolPegs',
    (at, id) => this.api.query.Stableswap.PoolPegs.getValue(id, { at }),
    (id) => String(id),
    'block'
  );

  /** One asset's tradable state in a pool */
  readonly tradability = this.cache.scope<[number, number], number>(
    'Stableswap.AssetTradability',
    (at, poolId, assetId) =>
      this.api.query.Stableswap.AssetTradability.getValue(poolId, assetId, {
        at,
      }),
    (poolId, assetId) => `${poolId}:${assetId}`,
    'block'
  );

  /** A pool's share token issuance */
  readonly issuance = this.cache.scope<[number], bigint | undefined>(
    'Tokens.TotalIssuance',
    (at, poolId) =>
      this.api.query.Tokens.TotalIssuance.getValue(poolId, { at }),
    (poolId) => String(poolId),
    'block'
  );

  /** EMA oracle entry a peg source references */
  readonly emaOracles = this.cache.scope<
    [TEmaName, TEmaPair, TEmaPeriod],
    TEmaOracle | undefined
  >(
    'EmaOracle.Oracles',
    (at, name, pair, period) =>
      this.api.query.EmaOracle.Oracles.getValue(name, pair, period, { at }),
    (name, pair, period) =>
      `${name.toString()}:${pair.join(':')}:${period.type}`,
    'block'
  );

  /** Managed/DIA oracle price, read over EVM */
  readonly mmOracles = this.cache.scope<[string], MmOracleEntry>(
    'MmOracle',
    async (_at, h160) =>
      this.mmOracle.getData(h160, await this.params.getBlockTime()),
    (h160) => h160.toLowerCase(),
    MM_ORACLE_TTL
  );

  async limits(): Promise<PoolLimits> {
    const minTradingLimit =
      await this.api.constants.Stableswap.MinTradingLimit();

    return {
      maxInRatio: 0n,
      maxOutRatio: 0n,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }
}
