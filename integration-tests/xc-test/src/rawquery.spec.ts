import { Parachain } from '@galacticcouncil/xc-core';
import { jest } from '@jest/globals';
import { Twox128, u128 } from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';
import * as c from 'console';

import { network, setup, SetupCtx } from './spec/e2e';

const { configService } = setup;
const { createNetwork } = network;

jest.setTimeout(4 * 60 * 1000);

/**
 * Proves the papi-native replacement for the legacy `state_getStorage` call in
 * AssethubClient.readBridgeBaseFee works against a forklift fork.
 *
 * forklift serves only the modern JSON-RPC spec, so `state_getStorage` fails
 * with "Method not found" — which is what killed all 24 transfers. papi's
 * `rawQuery` is backed by `chainHead_v1_storage`, which forklift does serve.
 */
describe('rawQuery replaces state_getStorage against forklift', () => {
  let ctx: SetupCtx;

  afterAll(async () => {
    await ctx?.teardown();
  });

  it('reads the bridge base fee at a raw well-known key', async () => {
    const assethub = configService.getChain('assethub') as Parachain;
    ctx = await createNetwork(assethub);

    // The key no pallet declares — hashed here, exactly as readBridgeBaseFee does.
    const key = toHex(
      Twox128(new TextEncoder().encode(':BridgeHubEthereumBaseFeeV2:'))
    );
    c.log('raw key:', key);

    // The legacy call forklift rejects.
    await expect(
      ctx.client._request('state_getStorage', [key])
    ).rejects.toThrow(/Method not found/);
    c.log('state_getStorage -> Method not found (as expected)');

    // The papi-native call forklift serves.
    const raw = await ctx.client.rawQuery(key, { at: 'best' });
    c.log('rawQuery ->', raw);

    expect(raw).toBeTruthy();
    const fee = u128.dec(raw!);
    c.log('decoded bridge base fee:', fee.toString());
    expect(fee).toBeGreaterThan(0n);
  });
});
