import { jest } from '@jest/globals';

import { ExecutorClient } from './executor';

/** Only msgValue varies across these cases; the gas limit is fixed. */
const budget = (msgValue: bigint) => ({ gasLimit: 500_000n, msgValue });

/** EQ01 quote with a controllable expiry: prefix, quoter, payee, chains, ts. */
const signedQuote = (expiresInSec: number): string => {
  const b = Buffer.alloc(165);
  b.write('EQ01', 0, 'ascii');
  b.writeBigUInt64BE(
    BigInt(Math.floor(Date.now() / 1000) + expiresInSec),
    4 + 20 + 32 + 2 + 2
  );
  return '0x' + b.toString('hex');
};

const HOUR = 3600;

let fetched = 0;
const mockQuote = (expiresInSec: number, cost = '1000') => {
  jest.spyOn(globalThis, 'fetch' as any).mockImplementation(async () => {
    fetched++;
    return {
      ok: true,
      json: async () => ({
        signedQuote: signedQuote(expiresInSec),
        estimatedCost: cost,
      }),
    } as any;
  });
};

describe('ExecutorClient.quote', () => {
  beforeEach(() => {
    fetched = 0;
  });
  afterEach(() => jest.restoreAllMocks());

  // The bug this exists for: the fee builder quotes to size the funding and
  // the contract builder quotes to spend it. Two fetches let the destination
  // gas price move in between, and the transfer reverts underfunded.
  it('should serve both callers the same live quote', async () => {
    mockQuote(HOUR);
    const a = await new ExecutorClient().quote(73, 2, budget(0n));
    const b = await new ExecutorClient().quote(73, 2, budget(0n));

    expect(b.signedQuote).toBe(a.signedQuote);
    expect(b.estimatedCost).toBe(a.estimatedCost);
    expect(fetched).toBe(1);
  });

  it('should refetch once the quote is near expiry', async () => {
    mockQuote(60); // inside the 5 min safety margin
    await new ExecutorClient().quote(73, 21, budget(0n));
    await new ExecutorClient().quote(73, 21, budget(0n));

    expect(fetched).toBe(2);
  });

  // A quote is only honoured for the instructions it priced, so a different
  // msgValue is a different quote - sharing one across them would send an
  // svm-priced payment with evm instructions or vice versa.
  it('should not share a quote across msgValues', async () => {
    mockQuote(HOUR);
    await new ExecutorClient().quote(73, 1, budget(0n));
    await new ExecutorClient().quote(73, 1, budget(6_000_000n));

    expect(fetched).toBe(2);
  });

  // Distinct ids per test: the cache is module level and outlives each case.
  it('should not share a quote across routes', async () => {
    mockQuote(HOUR);
    await new ExecutorClient().quote(73, 901, budget(0n));
    await new ExecutorClient().quote(73, 902, budget(0n));

    expect(fetched).toBe(2);
  });

  it('should encode the requested msgValue', async () => {
    mockQuote(HOUR);
    const q = await new ExecutorClient().quote(73, 903, budget(6_000_000n));

    // GasInstruction: type 01, gasLimit, then msgValue as a u128.
    expect(q.relayInstructions.endsWith((6_000_000).toString(16))).toBe(true);
  });

  it('should not cache a failed quote', async () => {
    jest
      .spyOn(globalThis, 'fetch' as any)
      .mockResolvedValue({ ok: false } as any);

    await expect(
      new ExecutorClient().quote(73, 8453, budget(0n))
    ).rejects.toThrow('Executor quote failed');

    mockQuote(HOUR);
    const ok = await new ExecutorClient().quote(73, 8453, budget(0n));
    expect(ok.estimatedCost).toBe(1000n);
  });
});
