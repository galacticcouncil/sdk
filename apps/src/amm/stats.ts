import { LogLine } from './logs';

/** `pool(SYNC) sync_reseed_all : {...}` → component, label, payload */
const LINE = /^pool\(([A-Z]+)\)\s+(\w+)\s*:?\s*(\{.*\})?/;

export interface Snapshot {
  /** Seeds that completed, and seeds that gave up */
  seeds: number;
  seedErrors: number;
  /** Per client, so a single client reseeding or failing is visible */
  seedsBy: Record<string, number>;
  errorsBy: Record<string, number>;
  /** Reorgs healed, with the deepest one seen */
  reorgs: number;
  maxDepth: number;
  /** Blocks lost below the feed's window */
  gaps: number;
  /** Reseeds by what asked for them */
  reseeds: Record<string, number>;
  /** Connection outages the probe saw */
  outages: number;
  downLast: number;
  downTotal: number;
  /** Reads that hit the query deadline */
  stalls: number;
  /** A client's pass that threw */
  syncErrors: number;
  lastError?: string;
}

const empty = (): Snapshot => ({
  seeds: 0,
  seedErrors: 0,
  seedsBy: {},
  errorsBy: {},
  reorgs: 0,
  maxDepth: 0,
  gaps: 0,
  reseeds: {},
  outages: 0,
  downLast: 0,
  downTotal: 0,
  stalls: 0,
  syncErrors: 0,
});

/**
 * Health counters, derived from the log stream.
 *
 * - Only the events that say something about stability; per-block noise is left
 *   to the log pane
 */
export class Stats {
  private snapshot = empty();

  get(): Snapshot {
    return this.snapshot;
  }

  reset() {
    this.snapshot = empty();
  }

  observe(line: LogLine) {
    const match = LINE.exec(line.text);
    if (!match) return;

    const [, client, label, json] = match;
    const s = this.snapshot;
    const data = this.payload(json);

    switch (label) {
      case 'pool_synced':
        s.seeds++;
        s.seedsBy[client] = (s.seedsBy[client] ?? 0) + 1;
        break;
      case 'pool_seed_error':
        s.seedErrors++;
        s.errorsBy[client] = (s.errorsBy[client] ?? 0) + 1;
        break;
      case 'chain_reorg':
        s.reorgs++;
        s.maxDepth = Math.max(s.maxDepth, Number(data.depth ?? 0));
        break;
      case 'chain_gap':
      case 'watchdog_gap':
        s.gaps++;
        break;
      case 'sync_reseed_all': {
        const reason = String(data.reason ?? 'unknown');
        s.reseeds[reason] = (s.reseeds[reason] ?? 0) + 1;
        if (data.downMs !== undefined) {
          s.outages++;
          s.downLast = Number(data.downMs);
          s.downTotal += s.downLast;
        }
        break;
      }
      case 'sync_error':
        s.syncErrors++;
        s.lastError = line.text;
        break;
    }

    if (line.text.includes('stalled at')) s.stalls++;
  }

  private payload(json?: string): Record<string, unknown> {
    if (!json) return {};
    try {
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
