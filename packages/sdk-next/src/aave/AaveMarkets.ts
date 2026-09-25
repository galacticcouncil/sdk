import { AbiDecodingZeroDataError } from 'viem';

import { AaveClient } from './AaveClient';
import { AAVE_MARKETS } from './const';
import { AaveAToken, AaveMarket } from './types';

import { Erc20Client } from '../client/Erc20Client';
import { EvmReadError, H160 } from '../evm';
import { assetIdFromAddress } from '../pool/amm/assetAddress';
import { memo } from '../utils/async';

const lower = (a: string) => a.toLowerCase() as H160;

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
   * The listed aToken behind an asset, or `null` when it is not one.
   *
   * - A non-`Erc20` asset resolves with no EVM read
   *
   * @param assetId - asset id
   * @param tradeable - look in tradeable markets only
   */
  async getAToken(
    assetId: number,
    tradeable = false
  ): Promise<AaveAToken | null> {
    const ids = await this.erc20.getIds();
    if (!ids.includes(assetId)) return null;
    const aTokens = await this.list(tradeable);
    return aTokens.find((t) => t.aTokenId === assetId) ?? null;
  }

  /**
   * Every registered aToken across all markets.
   *
   * - Rejects rather than returning a partial list when a read fails
   */
  async getATokens(): Promise<AaveAToken[]> {
    const aTokens = await this.list(false);
    return aTokens.sort((a, b) => a.aTokenId - b.aTokenId);
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

  private async list(tradeable: boolean): Promise<AaveAToken[]> {
    const markets = tradeable
      ? this.markets.filter((m) => m.tradeable)
      : this.markets;
    const lists = await Promise.all(
      markets.map((m) => memo(this.listings, m.provider, () => this.read(m)))
    );
    return lists.flat();
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
