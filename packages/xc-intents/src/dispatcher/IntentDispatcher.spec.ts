import { jest } from '@jest/globals';

import { authPathOf, encodeTerms } from '../terms/codec';
import { GOLDEN_TERMS } from '../terms/fixtures';

import { IntentDispatcher } from './IntentDispatcher';

const DISPATCHER = `0x${'2c'.repeat(20)}` as const;

function reader(overrides: Record<string, (args: any) => unknown> = {}) {
  const readContract = jest.fn(async ({ functionName, args }: any) => {
    if (overrides[functionName]) return overrides[functionName](args);
    switch (functionName) {
      case 'computeTerms':
        return encodeTerms(args[0]);
      case 'computeAuthPath':
        return authPathOf(encodeTerms(args[0]));
      case 'minOrderAmount':
        return 10n ** 11n;
      case 'nttManager':
        return `0x${'aa'.repeat(20)}`;
      case 'wormhole':
        return `0x${'bb'.repeat(20)}`;
      case 'quoteDeliveryPrice':
        return [[1n], 10n ** 12n - 5n];
      case 'messageFee':
        return 5n;
    }
    throw new Error(functionName);
  });
  return { readContract } as any;
}

describe('IntentDispatcher', () => {
  it('encodes terms the dispatcher agrees with', async () => {
    const d = new IntentDispatcher(reader(), DISPATCHER);
    const { encoded, authPath } = await d.encode(GOLDEN_TERMS);
    expect(authPath).toBe(authPathOf(encoded));
  });

  it('refuses terms the dispatcher packs differently', async () => {
    const d = new IntentDispatcher(
      reader({ computeTerms: () => '0x01' }),
      DISPATCHER
    );
    await expect(d.encode(GOLDEN_TERMS)).rejects.toThrow(/computeTerms/);
  });

  it('refuses a path that is not the hash of the terms', async () => {
    const d = new IntentDispatcher(
      reader({ computeAuthPath: () => `0x${'00'.repeat(32)}` }),
      DISPATCHER
    );
    await expect(d.encode(GOLDEN_TERMS)).rejects.toThrow(/computeAuthPath/);
  });

  it('reads an unpriced destination as undefined', async () => {
    const reverting = new IntentDispatcher(
      reader({
        outPerIn: () => {
          throw new Error('UnpricedAsset');
        },
      }),
      DISPATCHER
    );
    const zero = new IntentDispatcher(
      reader({ outPerIn: () => 0n }),
      DISPATCHER
    );
    await expect(reverting.outPerIn('x')).resolves.toBeUndefined();
    await expect(zero.outPerIn('x')).resolves.toBeUndefined();
  });

  it('sums delivery price and message fee into the order cost', async () => {
    const d = new IntentDispatcher(reader(), DISPATCHER);
    await expect(d.orderBase()).resolves.toEqual({
      cost: 10n ** 12n,
      minOrderAmount: 10n ** 11n,
    });
  });
});
