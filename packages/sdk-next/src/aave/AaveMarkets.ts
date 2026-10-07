import { AbiDecodingZeroDataError } from 'viem';

import { AaveClient } from './AaveClient';
import { AAVE_MARKETS } from './const';
import { AaveMarket } from './types';

import { Erc20Client } from '../client/Erc20Client';
import { EvmReadError, H160 } from '../evm';
import { assetIdFromAddress } from '../pool/amm/assetAddress';
import { memo } from '../utils/async';

const lower = (a: string) => a.toLowerCase() as H160;

/** An aToken the asset registry knows, with the market it belongs to */
export type AaveAToken = {
  aTokenId: number;
  aToken: H160;
  underlying: H160;
  underlyingId: number | null;
  market: AaveMarket;
};

/**
 * Whether a failed read settles the question for good.
 *
 * - An EVM revert, or empty return data from code without the function
 * - Matched by name: each subpath bundle carries its own error class
 * - Transport, dispatch and deadline failures are not an answer
 */
function isDefinitive(e: unknown): boolean {
  return (
    (e instanceof Error &&
      e.name === 'EvmReadError' &&
      (e as EvmReadError).reason === 'Revert') ||
    e instanceof AbiDecodingZeroDataError
  );
}

/**
 * Aave markets and their aTokens.
 *
 * - aTokens are listed from each market's reserves
 * - A reserve's aToken counts once the asset registry knows its contract
 * - Markets are read on the first lookup, then kept for the session
 * - In-flight reads are shared
 */
export class AaveMarkets {
  private readonly client: AaveClient;
  private readonly erc20: Erc20Client;
  private readonly markets = AAVE_MARKETS;

  private readonly listings = new Map<H160, Promise<AaveAToken[]>>();
  private readonly indexes = new Map<H160, Promise<number>>();
  private readonly plain = new Set<H160>();

  constructor(client: AaveClient, erc20: Erc20Client) {
    this.client = client;
    this.erc20 = erc20;
  }

  /**
   * The aToken of a tradeable market behind an asset, or `null` when it is
   * not one.
   *
   * - A non-`Erc20` asset resolves with no EVM read
   *
   * @param assetId - asset id
   */
  async getTradeableAToken(assetId: number): Promise<AaveAToken | null> {
    const ids = await this.erc20.getIds();
    if (!ids.includes(assetId)) return null;
    const tradeable = this.markets.filter((m) => m.tradeable);
    const lists = await Promise.all(tradeable.map((m) => this.list(m)));
    return lists.flat().find((t) => t.aTokenId === assetId) ?? null;
  }

  /**
   * The first market listing a reserve, or `null` when none does.
   *
   * - Markets are read in order and the scan stops at the first match
   *
   * @param reserve - reserve asset id
   */
  async getMarket(reserve: number): Promise<AaveMarket | null> {
    for (const market of this.markets) {
      const aTokens = await this.list(market);
      if (aTokens.some((t) => t.underlyingId === reserve)) return market;
    }
    return null;
  }

  /**
   * An aToken's reserve index in its pool.
   *
   * - Read from the pool: a dropped reserve shifts list positions, not ids
   * - Kept per aToken
   *
   * @param entry - a listed aToken
   */
  getReserveIndex(entry: AaveAToken): Promise<number> {
    const { aToken, underlying, market } = entry;
    return memo(this.indexes, aToken, () =>
      this.client.getReserveIndex(market.pool, underlying)
    );
  }

  /**
   * A user's unlocked balance of an aToken, or `undefined` when nothing of it
   * can be locked.
   *
   * - A plain aToken reverts the read and is kept as plain
   *
   * @param aToken - aToken contract
   * @param user - user H160
   */
  async getFreeBalance(
    aToken: H160,
    user: string
  ): Promise<bigint | undefined> {
    if (this.plain.has(aToken)) return undefined;
    try {
      return await this.client.getFreeBalance(aToken, user);
    } catch (e) {
      if (!isDefinitive(e)) throw e;
      this.plain.add(aToken);
      return undefined;
    }
  }

  private list(market: AaveMarket): Promise<AaveAToken[]> {
    return memo(this.listings, market.provider, () => this.read(market));
  }

  /**
   * A market's registered aTokens.
   *
   * - One reserve listing per market
   * - aTokens join to asset ids through the registry contract index
   *
   * @param market - market to read
   */
  private async read(market: AaveMarket): Promise<AaveAToken[]> {
    const [[reserves], byContract] = await Promise.all([
      this.client.getReservesData(market.provider),
      this.erc20.getContracts(),
    ]);
    return reserves.flatMap((r): AaveAToken[] => {
      const aToken = lower(r.aTokenAddress);
      const aTokenId = byContract.get(aToken);
      if (aTokenId === undefined) return [];
      const underlying = lower(r.underlyingAsset);
      return [
        {
          aTokenId,
          aToken,
          underlying,
          underlyingId: assetIdFromAddress(underlying, byContract) ?? null,
          market,
        },
      ];
    });
  }
}
