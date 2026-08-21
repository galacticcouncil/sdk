import {
  DIA_MM_BY_KEY,
  HYBRID_MM_BY_EMA,
  HYBRID_MM_BY_EMITTER,
  emaRouteKey,
} from './mappings';

/**
 * Routes an MM-oracle update signal to the mmAddress it should refresh.
 *
 * - Built from the active mmAddresses discovered in pool pegs
 * - Resolves by Managed/hybrid emitter, DIA `key`, or EMA update slot
 */
export class MmRouting {
  private byEmitter = new Map<string, string>();
  private byDiaKey = new Map<string, string>();
  private byEma = new Map<string, string>();

  /**
   * Rebuild the lookup maps for the given active mmAddresses.
   *
   * - Managed direct: emitter is itself the mmAddress
   * - Hybrid: wrapped Managed emitter → hybrid mmAddress
   * - DIA wrapper: `OracleUpdate` key → mmAddress
   * - Hybrid EMA leg: EMA update slot → hybrid mmAddress
   */
  build(mmAddresses: Set<string>) {
    this.byEmitter.clear();
    this.byDiaKey.clear();
    this.byEma.clear();

    for (const mm of mmAddresses) {
      this.byEmitter.set(mm, mm);
    }

    for (const [emitter, hybridMm] of Object.entries(HYBRID_MM_BY_EMITTER)) {
      const e = emitter.toLowerCase();
      const m = hybridMm.toLowerCase();
      if (mmAddresses.has(m)) this.byEmitter.set(e, m);
    }

    for (const [key, mm] of Object.entries(DIA_MM_BY_KEY)) {
      const m = mm.toLowerCase();
      if (mmAddresses.has(m)) this.byDiaKey.set(key, m);
    }

    for (const [key, mm] of Object.entries(HYBRID_MM_BY_EMA)) {
      const m = mm.toLowerCase();
      if (mmAddresses.has(m)) this.byEma.set(key, m);
    }
  }

  /** mmAddress for a Managed/hybrid emitter. */
  fromEmitter(emitter: string): string | undefined {
    return this.byEmitter.get(emitter);
  }

  /** mmAddress for a DIA `OracleUpdate` key. */
  fromDiaKey(key: string): string | undefined {
    return this.byDiaKey.get(key);
  }

  /** mmAddress for an EMA update slot (source, pair, period). */
  fromEma(
    source: string,
    pair: ArrayLike<number>,
    period: string
  ): string | undefined {
    return this.byEma.get(emaRouteKey(source, pair, period));
  }
}
