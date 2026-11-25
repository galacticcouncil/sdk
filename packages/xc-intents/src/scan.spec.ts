import { jest } from '@jest/globals';

import { fetchTrade, termsFromTrade } from './scan';
import { GOLDEN_ENCODED, GOLDEN_PATH, GOLDEN_TERMS } from './terms/fixtures';

describe('scan', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('fetches a trade and decodes its terms', async () => {
    const body = {
      trade: {
        auth_path: GOLDEN_PATH,
        terms: GOLDEN_ENCODED,
        status: 'pending',
      },
      orders: [],
      payouts: [],
    };
    const fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => body,
    }));
    global.fetch = fetch as any;

    const trade = await fetchTrade(
      'https://scan/api/v2',
      GOLDEN_PATH.toUpperCase()
    );
    expect((fetch.mock.calls[0] as any)[0]).toBe(
      `https://scan/api/v2/trades/${GOLDEN_PATH}`
    );
    const terms = termsFromTrade(trade!);
    expect(terms.recipient).toBe(GOLDEN_TERMS.recipient);
    expect(terms.deadline).toBe(GOLDEN_TERMS.deadline);
  });

  it('returns undefined for an unknown trade', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 404 })) as any;
    await expect(
      fetchTrade('https://scan', GOLDEN_PATH)
    ).resolves.toBeUndefined();
  });
});
