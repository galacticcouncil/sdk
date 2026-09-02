import { pool } from '@galacticcouncil/sdk-next';

type PoolBase = pool.PoolBase;

/** Decimals kept when a rational is rendered */
const PLACES = 10;

/** A peg pair is `[numerator, denominator]`; neither half means anything alone */
const isPegPair = (path: string, v: unknown): v is [string, string] =>
  /^pegs\.\d+$/.test(path) &&
  Array.isArray(v) &&
  v.length === 2 &&
  v.every((x) => typeof x === 'string' && /^\d+$/.test(x));

/** Exact decimal truncation; these numerators run to 39 digits */
export const ratio = (n: string, d: string): string => {
  const denominator = BigInt(d);
  if (denominator === 0n) return '∞';

  const scale = 10n ** BigInt(PLACES);
  const scaled = (BigInt(n) * scale) / denominator;
  return `${scaled / scale}.${(scaled % scale).toString().padStart(PLACES, '0')}`;
};

/**
 * Flatten a pool to `path -> readable scalar`.
 *
 * - Tokens are keyed by id, so a reordered `tokens` array is not a change
 * - Peg pairs collapse to one ratio per asset, not two opaque integers
 */
export const flatten = (p: PoolBase): Record<string, string> => {
  const out: Record<string, string> = {};

  const walk = (v: unknown, path: string) => {
    if (isPegPair(path, v)) {
      out[path] = ratio(v[0], v[1]);
      return;
    }

    if (v === null || typeof v !== 'object') {
      out[path] = String(v);
      return;
    }

    for (const [k, x] of Object.entries(v)) {
      walk(x, path ? `${path}.${k}` : k);
    }
  };

  walk({ ...p, tokens: Object.fromEntries(p.tokens.map((t) => [t.id, t])) }, '');
  return out;
};
