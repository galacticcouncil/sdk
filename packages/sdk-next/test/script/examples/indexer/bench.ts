import { PolkadotClient } from 'polkadot-api';

import { PapiExecutor } from '../../PapiExecutor';
import { ApiUrl } from '../../types';

import { IndexerStats, RpcPool, indexBlocks } from '../../../../src/indexer';

// Scan everything from FROM_BLOCK up to the current finalized tip.
const FROM_BLOCK = 70_000;
const CONCURRENCY = 100;
const BATCH_SIZE = 50;
const WITH_BLOCK = true;
const WITH_EVENTS = true;

class BenchIndexer extends PapiExecutor {
  async script(client: PolkadotClient) {
    const tip = await client.getFinalizedBlock();
    const fromBlock = FROM_BLOCK;
    const blockCount = Math.max(0, tip.number - fromBlock + 1);

    console.log();
    console.log(`  Block range:   ${fromBlock} → ${tip.number}`);
    console.log(`  Block count:   ${blockCount}`);
    console.log(`  Batch size:    ${BATCH_SIZE}`);
    console.log(`  Concurrency:   ${CONCURRENCY}`);
    console.log(`  With block:    ${WITH_BLOCK}`);
    console.log(`  With events:   ${WITH_EVENTS}`);
    console.log();

    const pool = RpcPool.fromClients([client]);
    const stats = new IndexerStats();

    const progress = setInterval(() => {
      const s = stats.snapshot();
      process.stdout.write(
        `\r  ${s.blocks} blocks | ${s.blocksPerSec.toFixed(0)} blk/s | ` +
          `${s.events} events (${s.eventsPerSec.toFixed(0)} evt/s) | ` +
          `${s.extrinsics} extrinsics | ` +
          `${(s.bytes / 1024 / 1024).toFixed(1)} MB | ` +
          `batch p50=${s.batchP50Ms.toFixed(0)}ms p95=${s.batchP95Ms.toFixed(0)}ms | ` +
          `${s.errors} err | ${(s.elapsedMs / 1000).toFixed(1)}s`
      );
    }, 2_000);

    await indexBlocks({
      pool,
      fromBlock,
      blockCount,
      concurrency: CONCURRENCY,
      batchSize: BATCH_SIZE,
      withBlock: WITH_BLOCK,
      withEvents: WITH_EVENTS,
      stats,
    });

    clearInterval(progress);

    const s = stats.snapshot();
    console.log('\n');
    console.log('═══════════════════════════════════════════════');
    console.log('  BENCHMARK RESULTS');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Blocks processed:  ${s.blocks}`);
    console.log(`  Events (approx):   ${s.events}`);
    console.log(`  Extrinsics:        ${s.extrinsics}`);
    console.log(`  Data received:     ${(s.bytes / 1024 / 1024).toFixed(1)} MB`);
    console.log(`  Errors:            ${s.errors}`);
    console.log(`  Total time:        ${(s.elapsedMs / 1000).toFixed(2)}s`);
    console.log(`  ─────────────────────────────────────────────`);
    console.log(`  Throughput:        ${s.blocksPerSec.toFixed(1)} blocks/sec`);
    console.log(`  Events/sec:        ${s.eventsPerSec.toFixed(1)}`);
    console.log(`  Batch p50:         ${s.batchP50Ms.toFixed(0)}ms`);
    console.log(`  Batch p95:         ${s.batchP95Ms.toFixed(0)}ms`);
    console.log(`  Batch p99:         ${s.batchP99Ms.toFixed(0)}ms`);
    console.log('═══════════════════════════════════════════════\n');

    pool.destroy();
  }
}

new BenchIndexer(ApiUrl.Lark1, 'Indexer block-ingestion benchmark').run();
