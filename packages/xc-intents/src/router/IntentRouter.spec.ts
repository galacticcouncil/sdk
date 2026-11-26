import { jest } from '@jest/globals';
import { base58 } from '@scure/base';

import { RecipientKind } from '../terms/types';

import { IntentRouter } from './IntentRouter';
import type { NearReader } from './types';

const ROUTER = 'intents-router.hydration-whm.near';
const ZEC = 'nep141:zec.omft.near';
const BTC = 'nep141:nbtc.bridge.near';
const WNEAR = 'nep141:wrap.near';

const ROUTES = {
  [ZEC]: {
    withdraw: 'withdraw-zec.near',
    path_prefix: 'zec:',
    address_prefixes: ['t1', 't3'],
    min_amount: '100000',
  },
  [BTC]: {
    withdraw: 'withdraw-btc.near',
    path_prefix: 'btc:',
    address_prefixes: ['1', '3', 'bc1q', 'bc1p'],
    min_amount: '6400',
  },
};

function mockNear(opts: { valid?: string[]; accounts?: string[] } = {}) {
  const view = jest.fn(async (contract: string, method: string, args: any) => {
    if (method === 'utxo_routes') return ROUTES;
    if (method === 'path_of') {
      if (opts.valid?.includes(args.address)) return `path:${args.address}`;
      throw new Error('Smart contract panicked: invalid address');
    }
    if (method === 'derived_public_key') {
      return `ed25519:${base58.encode(new Uint8Array(32).fill(0xab))}`;
    }
    throw new Error(`unexpected ${contract}.${method}`);
  });
  const viewAccount = jest.fn(async (id: string) =>
    opts.accounts?.includes(id) ? ({ amount: '1' } as any) : undefined
  );
  return { view, viewAccount } as unknown as NearReader & {
    view: typeof view;
  };
}

describe('IntentRouter', () => {
  it('derives A as the lowercase hex of the derived key', async () => {
    const near = mockNear();
    const router = new IntentRouter(near, ROUTER, 'v1.signer');
    const path = `0x${'cd'.repeat(32)}`;
    await expect(router.deriveAccount(path)).resolves.toBe('ab'.repeat(32));
    expect(near.view).toHaveBeenCalledWith('v1.signer', 'derived_public_key', {
      path,
      predecessor: ROUTER,
      domain_id: 1,
    });
  });

  it('accepts a ZEC address the withdraw contract takes', async () => {
    const addr = 't1KPVSRgnFHPBWMJLC7taJioN6m5Q6jVBma';
    const router = new IntentRouter(mockNear({ valid: [addr] }), ROUTER, 's');
    const route = await router.checkRecipient(
      ZEC,
      RecipientKind.Withdraw,
      addr
    );
    expect(route?.min_amount).toBe('100000');
  });

  it('rejects an address the withdraw contract refuses', async () => {
    const router = new IntentRouter(mockNear(), ROUTER, 's');
    await expect(
      router.checkRecipient(ZEC, RecipientKind.Withdraw, 't1Bad')
    ).rejects.toThrow(/rejects/);
  });

  it('rejects a prefix the route does not take', async () => {
    const router = new IntentRouter(mockNear(), ROUTER, 's');
    await expect(
      router.checkRecipient(BTC, RecipientKind.Withdraw, 'tb1qtestnet')
    ).rejects.toThrow(/takes/);
  });

  it('rejects shielded Zcash', async () => {
    const router = new IntentRouter(mockNear(), ROUTER, 's');
    for (const addr of ['zs1abc', 'u1abc']) {
      await expect(
        router.checkRecipient(ZEC, RecipientKind.Withdraw, addr)
      ).rejects.toThrow(/Shielded/);
    }
  });

  it('pays NEAR only to an existing account', async () => {
    const router = new IntentRouter(
      mockNear({ accounts: ['alice.near'] }),
      ROUTER,
      's'
    );
    await expect(
      router.checkRecipient(WNEAR, RecipientKind.Withdraw, 'alice.near')
    ).resolves.toBeUndefined();
    await expect(
      router.checkRecipient(WNEAR, RecipientKind.Withdraw, 'nobody.near')
    ).rejects.toThrow(/no NEAR account/);
  });

  it('takes any valid account id for an intents transfer', async () => {
    const router = new IntentRouter(mockNear(), ROUTER, 's');
    await expect(
      router.checkRecipient(ZEC, RecipientKind.IntentsAccount, 'bob.near')
    ).resolves.toBeUndefined();
    await expect(
      router.checkRecipient(ZEC, RecipientKind.IntentsAccount, 'Bob.Near')
    ).rejects.toThrow(/account id/);
  });
});
