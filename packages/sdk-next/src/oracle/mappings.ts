// Static mappings used to route MM-oracle events to the correct mmAddress.
//
// MM oracles come in three kinds (see docs/ORACLE_SPEC.md):
//   - Managed       — emitter is the mmAddress itself (routes implicitly)
//   - DIA wrapper   — wrapper has no event; routed by the DIA event's `key`
//   - Hybrid        — composes a Managed feed × a substrate-asset price;
//                     emits nothing; routed via the wrapped Managed emitter

/** DIA `OracleUpdate` `key` → mmAddress that wraps that feed. */
export const DIA_MM_BY_KEY: Record<string, string> = {
  'EUR/USD': '0xaa47a5662269270d3df33ae08f806e383611575c',
  'sUSDs/USD': '0x4b32bffc6acd751446e79e8687ef3815fd7924fd',
  'sUSDe/USD': '0x22cdea305cee63d082e79f8c5db939eecd0265d0',
};

/** Wrapped Managed emitter address → hybrid mmAddress to refresh. */
export const HYBRID_MM_BY_EMITTER: Record<string, string> = {
  // vDOT-DiscountOracle (Managed) → vDOT-Discount-HybridOracleAggregator
  '0xcfab6a4031c70da0f0cf6f31a252c16119db3611':
    '0xaafd758688cefd0a7b7770a825f1aad551e16185',
};

/**
 * EMA-driven hybrid refresh: `${source}:${pairA}:${pairB}:${period}` (pair
 * sorted ascending) → hybrid mmAddress to refresh when *that exact slot*
 * updates.
 *
 *  - `source` is the 8-byte EmaOracle source tag as ASCII, null-trimmed.
 *  - `period` matches the hybrid contract's period byte (see ORACLE_SPEC §2.5);
 *    `update_bifrost_oracle` writes all three persisted periods on every push,
 *    so pinning the period here avoids 3× redundant refreshes per keeper call.
 */
export const HYBRID_MM_BY_EMA: Record<string, string> = {
  // bifrosto · (DOT=5, vDOT=15) · LastBlock → vDOT-Discount-HybridOracleAggregator
  'bifrosto:5:15:LastBlock': '0xaafd758688cefd0a7b7770a825f1aad551e16185',
};

/**
 * Build the canonical routing key for `HYBRID_MM_BY_EMA`.
 *
 * Mirrors the EmaOracle.Oracles storage key shape:
 *  - `sourceHex`: SizedHex<8> from runtime (`0x` + 16 hex chars), decoded to
 *                 ASCII source tag with trailing nulls trimmed.
 *  - `pair`: sorted ascending (`[min, max]`) to match pallet normalisation.
 *  - `period`: the OraclePeriod variant name (`LastBlock` / `Short` / …).
 */
export function emaRouteKey(
  sourceHex: string,
  pair: ArrayLike<number>,
  period: string
): string {
  const source = Buffer.from(sourceHex.replace(/^0x/, ''), 'hex')
    .toString('ascii')
    .replace(/\0+$/, '');
  const [a, b] = [pair[0], pair[1]].sort((x, y) => x - y);
  return `${source}:${a}:${b}:${period}`;
}
