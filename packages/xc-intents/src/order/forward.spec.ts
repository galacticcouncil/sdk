import { decodeAbiParameters, size } from 'viem';

import { encodeTerms } from '../terms/codec';
import { GOLDEN_ENCODED, GOLDEN_TERMS } from '../terms/fixtures';

import { forwardData } from './forward';

const DEPOSIT = `0x${'44'.repeat(20)}` as const;

describe('forwardData', () => {
  it('encodes deposit address, ceiling and terms', () => {
    const data = forwardData(DEPOSIT, 123n, GOLDEN_ENCODED);
    const [deposit, ceiling, terms] = decodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }],
      data
    );
    expect(deposit.toLowerCase()).toBe(DEPOSIT);
    expect(ceiling).toBe(123n);
    expect(terms).toBe(GOLDEN_ENCODED);
  });

  it('fits ICE at 265 bytes of destination and recipient', () => {
    const terms = encodeTerms({
      ...GOLDEN_TERMS,
      destinationAsset: 'a'.repeat(10),
      recipient: 'b'.repeat(255),
    });
    expect(size(forwardData(DEPOSIT, 1n, terms))).toBe(512);
  });

  it('throws over 512 bytes', () => {
    const terms = encodeTerms({
      ...GOLDEN_TERMS,
      destinationAsset: 'a'.repeat(11),
      recipient: 'b'.repeat(255),
    });
    expect(() => forwardData(DEPOSIT, 1n, terms)).toThrow(/512/);
  });
});
