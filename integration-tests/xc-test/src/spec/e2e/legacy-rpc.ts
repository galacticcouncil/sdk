import { createClient, type PolkadotClient } from 'polkadot-api';
import type { ForkliftOptions } from '@polkadot-api/forklift';

type RpcOverrides = ForkliftOptions['rpcOverrides'];
type Ctx = Parameters<NonNullable<RpcOverrides[string]>>[2];

/**
 * Legacy JSON-RPC, served on top of a fork.
 *
 * forklift implements only the modern spec (chainHead / archive / chainSpec),
 * so every legacy call the SDK makes comes back `-32601 Method not found`.
 * Rather than rewrite published SDK packages to suit the test runner, answer
 * the legacy methods here: `rpcOverrides` is merged over forklift's own method
 * table, so these are indistinguishable from built-ins to anything dialing the
 * fork.
 *
 * Each is backed by a papi client on the fork itself — the same trick forklift
 * uses internally to talk to its own server (see its rpc/forklift_xcm.js, which
 * does `createClient(ctx.provider)`).
 */
export const legacyRpc = () => {
  let client: PolkadotClient | undefined;
  const clientOf = (ctx: Ctx) => (client ??= createClient(ctx.provider));

  const method =
    (fn: (params: any[], client: PolkadotClient) => Promise<unknown>) =>
    async (con: any, req: any, ctx: Ctx) => {
      try {
        const result = await fn(req.params ?? [], clientOf(ctx));
        con.send({ jsonrpc: '2.0', id: req.id, result });
      } catch (e: any) {
        con.send({
          jsonrpc: '2.0',
          id: req.id,
          error: { code: -32603, message: e?.message ?? String(e) },
        });
      }
    };

  const overrides: RpcOverrides = {
    // xc-sdk SubstrateService.buildMessageId, reached by every extrinsic-based
    // transfer. The fork's tx pool is empty whenever this is called (the suite
    // builds one block per transfer), so the on-chain nonce and the pool-aware
    // "next index" agree here — which is NOT true in production, which is why
    // the SDK keeps using the pool-aware RPC.
    system_accountNextIndex: method(async ([address], c) =>
      Number(await c.getUnsafeApi().apis.AccountNonceApi.account_nonce(address))
    ),

    // xc-cfg AssethubClient.readBridgeBaseFee — a well-known key that no pallet
    // declares, so it can only be read raw.
    state_getStorage: method(([key], c) => c.rawQuery(key, { at: 'best' })),

    // common blockProbe$ — reads nothing off the header but `number`.
    chain_getHeader: method(async (_params, c) => {
      const { number } = await c.getFinalizedBlock();
      return { number: '0x' + number.toString(16) };
    }),

    // sdk-next connectionProbe$ — a liveness check; reaching us means alive.
    system_health: method(async () => ({
      peers: 1,
      isSyncing: false,
      shouldHavePeers: false,
    })),
  };

  return { overrides, destroy: () => client?.destroy() };
};
