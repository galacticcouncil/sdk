import { AccountId } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { HYDRATION_SS58_PREFIX } from '@galacticcouncil/common';

import { TAssetDetails, TAssetLocation } from '../../PoolQuery';
import { PoolBase, PoolLimits, PoolType } from '../../types';

import { assetIdFromAddress } from '../assetAddress';

import { AavePoolToken } from './AavePool';
import { TAavePool } from './types';

/** A reserve/aToken pair with both legs resolved to registry ids */
export type AaveReservePair = {
  reserve: `0x${string}`;
  atoken: `0x${string}`;
  reserveId: number;
  atokenId: number;
};

/** A reserve left out of the venue, with the leg that failed to resolve */
export type AaveSkippedReserve = {
  reserve: `0x${string}`;
  atoken?: `0x${string}`;
  reason: 'reserve' | 'atoken';
};

/**
 * Pair every reserve with its aToken and resolve both to registry ids.
 *
 * - Addresses resolve as the runtime's erc20 mapping does: alias first, then
 *   the registry contract index
 * - A reserve without an aToken address, or with a leg the registry does not
 *   know, is reported in `skipped` and left out of `pairs`
 *
 * @param reserves - the reserve addresses the pool lists
 * @param atokens - aToken address per reserve
 * @param byContract - registry contract index, lowercased H160 -> id
 */
export function pairReserves(
  reserves: readonly `0x${string}`[],
  atokens: ReadonlyMap<string, `0x${string}`>,
  byContract: ReadonlyMap<string, number>
): { pairs: AaveReservePair[]; skipped: AaveSkippedReserve[] } {
  const pairs: AaveReservePair[] = [];
  const skipped: AaveSkippedReserve[] = [];

  for (const reserve of reserves) {
    const atoken = atokens.get(reserve);
    const reserveId = assetIdFromAddress(reserve, byContract);
    if (reserveId === undefined) {
      skipped.push({ reserve, atoken, reason: 'reserve' });
      continue;
    }
    const atokenId = atoken && assetIdFromAddress(atoken, byContract);
    if (!atoken || atokenId === undefined) {
      skipped.push({ reserve, atoken, reason: 'atoken' });
      continue;
    }
    pairs.push({ reserve, atoken, reserveId, atokenId });
  }
  return { pairs, skipped };
}

/**
 * The venue's pool address for a pair: the padded `reserve/atoken` name as an
 * account id.
 *
 * @param reserve - reserve asset id
 * @param atoken - aToken asset id
 */
export function aavePoolId(reserve: number, atoken: number): string {
  const id = reserve + '/' + atoken;
  const nameU8a = new TextEncoder().encode(id.padEnd(32, '\0'));
  const nameHex = toHex(nameU8a);
  return AccountId(HYDRATION_SS58_PREFIX).dec(nameHex);
}

/** Trade limits; the money market imposes none of its own */
export function aavePoolLimits(): PoolLimits {
  return {
    maxInRatio: 0n,
    maxOutRatio: 0n,
    minTradingLimit: 0n,
  } as PoolLimits;
}

/**
 * Assemble one Aave pool from a pair and its trade executor liquidity.
 *
 * - `tokens[0]` is the reserve leg carrying `liqudity_in`
 * - `tokens[1]` is the aToken leg carrying `liqudity_out`
 * - Decimals, existential deposit, location and type come from the registry
 *
 * @param pair - the resolved reserve/aToken pair
 * @param liquidity - the pair's `AaveTradeExecutor.pool` value
 * @param assets - registry entries, keyed by id
 * @param locations - registry locations, keyed by id
 */
export function toAavePool(
  pair: Pick<AaveReservePair, 'reserveId' | 'atokenId'>,
  liquidity: Pick<TAavePool, 'liqudity_in' | 'liqudity_out'>,
  assets: ReadonlyMap<number, TAssetDetails>,
  locations: ReadonlyMap<number, TAssetLocation>
): PoolBase {
  const { reserveId, atokenId } = pair;
  const { liqudity_in, liqudity_out } = liquidity;

  const reserveMeta = assets.get(reserveId);
  const aTokenMeta = assets.get(atokenId);

  return {
    address: aavePoolId(reserveId, atokenId),
    type: PoolType.Aave,
    tokens: [
      {
        id: reserveId,
        decimals: reserveMeta?.decimals,
        existentialDeposit: reserveMeta?.existential_deposit,
        balance: liqudity_in,
        location: locations.get(reserveId),
        type: reserveMeta?.asset_type.type,
      } as AavePoolToken,
      {
        id: atokenId,
        decimals: aTokenMeta?.decimals,
        existentialDeposit: aTokenMeta?.existential_deposit,
        balance: liqudity_out,
        location: locations.get(atokenId),
        type: aTokenMeta?.asset_type.type,
      } as AavePoolToken,
    ],
    ...aavePoolLimits(),
  } as PoolBase;
}
