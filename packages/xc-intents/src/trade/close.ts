import type { EvmCall } from '@galacticcouncil/xc-sdk';

import { DEFAULT_CLOSE_DELAY, MAX_CLOSE_DELAY } from '../consts';
import { authPathOf, encodeTerms } from '../terms/codec';
import type { Terms } from '../terms/types';

import { buildCloseCalls } from './builder';
import type { TradeContext } from './types';

/**
 * Closes a set of terms, ending a TWAP early.
 *
 * - After `delay`, the router pays out `A` and refunds leftover ETH
 * - The ICE intent keeps trading until removed; batch `Intent.remove_intent` with it
 *
 * @param ctx - trade context
 * @param terms - the action's exact terms
 * @param delay - countdown, seconds, at most a day
 * @throws when the delay is out of range or the terms are already closed
 */
export async function closeCalls(
  ctx: TradeContext,
  terms: Terms,
  delay: number = DEFAULT_CLOSE_DELAY
): Promise<EvmCall[]> {
  if (!Number.isInteger(delay) || delay < 0 || delay > MAX_CLOSE_DELAY) {
    throw new Error(`Close delay ${delay} is outside 0..${MAX_CLOSE_DELAY}`);
  }
  const authPath = authPathOf(encodeTerms(terms));
  const [closed, messageFee] = await Promise.all([
    ctx.dispatcher.closed(authPath),
    ctx.dispatcher.messageFee(),
  ]);
  if (closed) throw new Error(`Terms ${authPath} are already closed`);

  return buildCloseCalls({
    from: terms.owner,
    dispatcher: ctx.dispatcher.address,
    terms,
    delay,
    messageFee,
  });
}
