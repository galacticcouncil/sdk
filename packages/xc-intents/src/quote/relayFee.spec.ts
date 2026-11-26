import { jest } from '@jest/globals';

import { relayFeeCeiling } from './relayFee';

describe('relayFeeCeiling', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('reads feeRequested with the margin', async () => {
    const fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ feeRequested: '317000000000000' }),
    }));
    global.fetch = fetch as any;
    await expect(relayFeeCeiling('https://q', 2000)).resolves.toBe(
      317_000_000_000_000n
    );
    expect((fetch.mock.calls[0] as any)[0]).toBe(
      'https://q/relay-fee?chain=ethereum&marginBps=2000'
    );
  });
});
