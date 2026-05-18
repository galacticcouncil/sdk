export interface IndexerSnapshot {
  blocks: number;
  events: number;
  extrinsics: number;
  bytes: number;
  errors: number;
  elapsedMs: number;
  blocksPerSec: number;
  eventsPerSec: number;
  batchP50Ms: number;
  batchP95Ms: number;
  batchP99Ms: number;
}

export class IndexerStats {
  blocks = 0;
  events = 0;
  extrinsics = 0;
  bytes = 0;
  errors = 0;

  private startedAt = 0;
  private readonly batchTimes: number[] = [];

  start(): void {
    this.startedAt = performance.now();
  }

  recordBlock(opts: { events?: number; extrinsics?: number; bytes?: number } = {}): void {
    this.blocks++;
    if (opts.events) this.events += opts.events;
    if (opts.extrinsics) this.extrinsics += opts.extrinsics;
    if (opts.bytes) this.bytes += opts.bytes;
  }

  recordBatch(durationMs: number): void {
    this.batchTimes.push(durationMs);
  }

  recordError(): void {
    this.errors++;
  }

  elapsedMs(): number {
    return this.startedAt === 0 ? 0 : performance.now() - this.startedAt;
  }

  percentile(p: number): number {
    if (this.batchTimes.length === 0) return 0;
    const sorted = [...this.batchTimes].sort((a, b) => a - b);
    const i = Math.floor((p / 100) * sorted.length);
    return sorted[Math.min(i, sorted.length - 1)];
  }

  snapshot(): IndexerSnapshot {
    const elapsedMs = this.elapsedMs();
    const elapsedSec = elapsedMs / 1000;
    return {
      blocks: this.blocks,
      events: this.events,
      extrinsics: this.extrinsics,
      bytes: this.bytes,
      errors: this.errors,
      elapsedMs,
      blocksPerSec: elapsedSec > 0 ? this.blocks / elapsedSec : 0,
      eventsPerSec: elapsedSec > 0 ? this.events / elapsedSec : 0,
      batchP50Ms: this.percentile(50),
      batchP95Ms: this.percentile(95),
      batchP99Ms: this.percentile(99),
    };
  }
}
