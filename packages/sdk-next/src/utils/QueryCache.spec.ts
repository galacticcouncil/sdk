import { QueryCache } from './QueryCache';

const AT = '0x01';
const NEXT = '0x02';

function setup(batched = true) {
  const cache = new QueryCache();
  const reads = { single: [] as number[], many: [] as number[][] };
  let fail = false;

  const scope = cache.scope<[number], number>(
    'test',
    async (_at, id) => {
      reads.single.push(id);
      return id * 10;
    },
    (id) => String(id),
    'block',
    batched
      ? async (_at, args) => {
          reads.many.push(args.map(([id]) => id));
          if (fail) throw new Error('boom');
          return args.map(([id]) => id * 10);
        }
      : undefined
  );

  const failBatch = (v: boolean) => {
    fail = v;
  };
  return { cache, reads, scope, failBatch };
}

describe('QueryCache getMany', () => {
  it('reads every miss in one batch, in input order', async () => {
    const { reads, scope } = setup();

    const values = await scope.getMany(AT, [[3], [1], [2]]);

    expect(values).toEqual([30, 10, 20]);
    expect(reads.many).toEqual([[3, 1, 2]]);
    expect(reads.single).toEqual([]);
  });

  it('serves a later get at the same block from the batch', async () => {
    const { cache, reads, scope } = setup();

    await scope.getMany(AT, [[1], [2]]);
    const value = await scope.get(AT, 2);

    expect(value).toBe(20);
    expect(reads.single).toEqual([]);
    expect(cache.tally.memo).toBe(1);
  });

  it('batches only what live and memo do not hold', async () => {
    const { reads, scope } = setup();

    scope.set(99, 1);
    await scope.get(AT, 2);
    const values = await scope.getMany(AT, [[1], [2], [3]]);

    expect(values).toEqual([99, 20, 30]);
    expect(reads.many).toEqual([[3]]);
  });

  it('reads a repeated key once', async () => {
    const { reads, scope } = setup();

    const values = await scope.getMany(AT, [[1], [1]]);

    expect(values).toEqual([10, 10]);
    expect(reads.many).toEqual([[1]]);
  });

  it('drops the batch memo when the read moves to a new block', async () => {
    const { reads, scope } = setup();

    await scope.getMany(AT, [[1]]);
    await scope.getMany(NEXT, [[1]]);

    expect(reads.many).toEqual([[1], [1]]);
  });

  it('forgets a failed batch so the next read retries', async () => {
    const { reads, scope, failBatch } = setup();

    failBatch(true);
    await expect(scope.getMany(AT, [[1]])).rejects.toThrow('boom');
    failBatch(false);
    const values = await scope.getMany(AT, [[1]]);

    expect(values).toEqual([10]);
    expect(reads.many).toEqual([[1], [1]]);
  });

  it('never memoizes a batch read at a tag', async () => {
    const { cache, reads, scope } = setup();

    await scope.getMany('best', [[1]]);
    await scope.getMany('best', [[1]]);

    expect(reads.many).toEqual([[1], [1]]);
    expect(cache.tally.unpinned).toBe(2);
  });

  it('reads one key at a time without a batch fetch', async () => {
    const { reads, scope } = setup(false);

    const values = await scope.getMany(AT, [[1], [2]]);

    expect(values).toEqual([10, 20]);
    expect(reads.single).toEqual([1, 2]);
  });
});
