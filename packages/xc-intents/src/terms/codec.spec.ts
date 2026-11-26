import { getAddress } from 'viem';

import { authPathOf, decodeTerms, encodeTerms } from './codec';
import { GOLDEN_ENCODED, GOLDEN_PATH, GOLDEN_TERMS } from './fixtures';

describe('terms codec', () => {
  it('packs the golden vector', () => {
    expect(encodeTerms(GOLDEN_TERMS)).toBe(GOLDEN_ENCODED);
  });

  it('hashes the golden vector to its path', () => {
    expect(authPathOf(GOLDEN_ENCODED)).toBe(GOLDEN_PATH);
  });

  it('packs checksummed addresses as their bytes', () => {
    const terms = {
      ...GOLDEN_TERMS,
      owner: getAddress(`0x${'ab'.repeat(20)}`),
    };
    expect(encodeTerms(terms)).toContain('ab'.repeat(20));
  });

  it('round-trips through the decoder', () => {
    const decoded = decodeTerms(GOLDEN_ENCODED);
    expect(encodeTerms(decoded)).toBe(GOLDEN_ENCODED);
    expect(decoded.recipient).toBe(GOLDEN_TERMS.recipient);
    expect(decoded.minOutPerIn).toBe(GOLDEN_TERMS.minOutPerIn);
  });

  it('rejects trailing bytes and other versions', () => {
    expect(() => decodeTerms(`${GOLDEN_ENCODED}00`)).toThrow();
    expect(() => decodeTerms(`0x02${GOLDEN_ENCODED.slice(4)}`)).toThrow();
  });

  it.each([
    ['zero owner', { owner: `0x${'00'.repeat(20)}` }],
    ['zero quoteId', { quoteId: `0x${'00'.repeat(32)}` }],
    ['slippage of 100%', { maxSlippageBps: 10_000 }],
    ['fill multiplier 1', { maxFillMultiplier: 1 }],
    ['fill multiplier 101', { maxFillMultiplier: 101 }],
    ['zero deadline', { deadline: 0n }],
    ['recipient kind 2', { recipientKind: 2 }],
    ['zero refundTo', { refundTo: `0x${'00'.repeat(20)}` }],
    ['empty destination', { destinationAsset: '' }],
    ['recipient with a space', { recipient: 't1 x' }],
    ['recipient over 255 bytes', { recipient: 'a'.repeat(256) }],
  ])('rejects %s, as the dispatcher does', (_, patch) => {
    expect(() => encodeTerms({ ...GOLDEN_TERMS, ...patch } as any)).toThrow();
  });
});
