import { jest } from '@jest/globals';

import { depositAddressOf, relayFeeCeiling } from './quote';

const A = 'ab'.repeat(32);
const ADDRESS = '0x' + '44'.repeat(20);

describe('depositAddressOf', () => {
  it('takes a pass-through forwarding to A', () => {
    expect(
      depositAddressOf({ address: ADDRESS, recipient: A, refundTo: A }, A)
    ).toBe('0x4444444444444444444444444444444444444444');
  });

  it('refuses one naming another account', () => {
    expect(() =>
      depositAddressOf({ address: ADDRESS, recipient: 'x', refundTo: A }, A)
    ).toThrow(/does not forward/);
    expect(() =>
      depositAddressOf({ address: ADDRESS, recipient: A, refundTo: 'x' }, A)
    ).toThrow(/does not forward/);
  });

  it('refuses a non-EVM address', () => {
    expect(() =>
      depositAddressOf({ address: 'bc1q', recipient: A, refundTo: A }, A)
    ).toThrow(/no EVM address/);
  });
});

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
