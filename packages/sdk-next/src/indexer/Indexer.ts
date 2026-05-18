import { BlockFetcher } from './BlockFetcher';
import { IndexerStats } from './IndexerStats';
import { RpcPool } from './RpcPool';
import { Semaphore } from './Semaphore';
import { BlockHandler, RawBlock } from './types';

export interface IndexBlocksOptions {
  pool: RpcPool;
  fromBlock: number;
  // inclusive count of blocks starting at fromBlock
  blockCount: number;
  // upper bound on in-flight batches
  concurrency?: number;
  // blocks per batch (each batch fetched in parallel, scheduled by the semaphore)
  batchSize?: number;
  // when true, fetches chain_getBlock (header + extrinsics) for every block. Default false.
  withBlock?: boolean;
  // when true, fetches the raw System.Events blob for every block. Default false.
  withEvents?: boolean;
  // called for every successfully fetched block
  onBlock?: BlockHandler;
  // called for every fetch error (with the failing block number)
  onError?: (err: unknown, blockNumber: number) => void;
  // pre-allocated stats sink; created if omitted
  stats?: IndexerStats;
}

export interface IndexBlocksResult {
  stats: IndexerStats;
}

export async function indexBlocks(
  opts: IndexBlocksOptions
): Promise<IndexBlocksResult> {
  const {
    pool,
    fromBlock,
    blockCount,
    concurrency = 100,
    batchSize = 50,
    withBlock = false,
    withEvents = false,
    onBlock,
    onError,
  } = opts;

  if (blockCount <= 0) {
    const stats = opts.stats ?? new IndexerStats();
    stats.start();
    return { stats };
  }

  const stats = opts.stats ?? new IndexerStats();
  const sem = new Semaphore(concurrency);
  const fetcher = new BlockFetcher(() => pool.next());

  const batches: number[][] = [];
  for (let i = 0; i < blockCount; i += batchSize) {
    const batch: number[] = [];
    for (let j = 0; j < batchSize && i + j < blockCount; j++) {
      batch.push(fromBlock + i + j);
    }
    batches.push(batch);
  }

  stats.start();

  await Promise.all(
    batches.map((batch) =>
      sem.run(async () => {
        const batchStart = performance.now();
        await Promise.all(
          batch.map(async (n) => {
            let block: RawBlock | null = null;
            try {
              block = await fetcher.getBlock(n, { withBlock, withEvents });
            } catch (err) {
              stats.recordError();
              onError?.(err, n);
              return;
            }
            if (!block) {
              stats.recordError();
              return;
            }
            stats.recordBlock({
              events: block.eventsCount,
              extrinsics: block.extrinsics.length,
              bytes: block.bytes,
            });
            if (onBlock) {
              try {
                await onBlock(block);
              } catch (err) {
                stats.recordError();
                onError?.(err, n);
              }
            }
          })
        );
        stats.recordBatch(performance.now() - batchStart);
      })
    )
  );

  return { stats };
}
