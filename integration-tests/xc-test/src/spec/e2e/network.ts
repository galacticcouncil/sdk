import { forklift, wsSource, type Forklift } from '@polkadot-api/forklift';
import { Parachain } from '@galacticcouncil/xc-core';

import { createClient, Enum, type HexString } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws';

import { filter, firstValueFrom } from 'rxjs';

import { readFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { WebSocketServer } from 'ws';

import * as c from 'console';

import { encodeStorage, type DecodedStorage } from './encode-storage';
import { endpointsFor } from './endpoints';
import { verboseExecutor } from './executor';
import { legacyRpc } from './legacy-rpc';
import { resilient } from './source';
import { initStorage } from './storage';
import { NewBlockParams, SetupCtx } from './types';

/** `:code` — the runtime wasm is just a storage entry. */
const CODE_KEY = '0x3a636f6465';

/**
 * A cold fork pulls the runtime's whole working set on block one, over ~330
 * serial round-trips — so this budget tracks endpoint latency, not chain size.
 * At ~500ms rtt (the best AssetHub endpoint) that is already ~2.5 min.
 */
const WARMUP_TIMEOUT = 240_000;

const withTimeout = <T,>(p: Promise<T>, ms: number, msg: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${msg} (${ms / 1000}s)`)), ms);
    }),
  ]).finally(() => clearTimeout(timer)) as Promise<T>;
};

/**
 * forklift exposes a `JsonRpcProvider`, not a server. Wrap it in a WebSocket so
 * papi can dial it, and so the forks can reach each other for XCM (the
 * `forklift_xcm_attach_*` methods take a ws:// url).
 */
const serve = (fork: Forklift) =>
  new Promise<{ url: string; close: () => Promise<void> }>((resolve) => {
    const wss = new WebSocketServer({ port: 0 });

    wss.on('connection', (ws) => {
      const con = fork.serve((msg) => ws.send(JSON.stringify(msg)));
      ws.on('message', (msg) => con.send(JSON.parse(String(msg))));
      ws.on('close', () => con.disconnect());
    });

    wss.on('listening', () => {
      const { port } = wss.address() as AddressInfo;
      resolve({
        url: `ws://127.0.0.1:${port}`,
        // `wss.close()` only calls back once every socket has drained, and the
        // XCM peers never hang up: forklift's attach_relay / attach_sibling open
        // a client into this server and never destroy it. Without terminating
        // them by hand, teardown blocks until jest's hook timeout.
        close: () =>
          new Promise<void>((res) => {
            for (const ws of wss.clients) ws.terminate();
            wss.close(() => res());
          }),
      });
    });
  });

const firstOf = <T>(v: T | T[] | undefined): T | undefined =>
  Array.isArray(v) ? v[0] : v;

export async function createNetwork(
  parachain: Parachain,
  wasmOverrides?: Record<string, string>
): Promise<SetupCtx> {
  const endpoints = endpointsFor(parachain.key, parachain.ws);
  const legacy = legacyRpc();
  const fork = forklift(resilient(wsSource(endpoints)), {
    // Leave on_idle alone. Inbound XCM is executed by MessageQueue during
    // on_idle on the receiving chain, so disabling it silently drops delivery:
    // the source sends the message and the destination never dequeues it — not
    // even a failure event, just an empty block.
    disableOnIdle: false,
    // The suite drives block production itself; never build on a timer.
    buildBlockMode: Enum('manual'),
    // Finalize as soon as a block is built, so papi's head follows it.
    finalizeMode: Enum('timer', 0),
    // Answer the legacy JSON-RPC the SDK still speaks, so the SDK doesn't have
    // to change to be testable.
    rpcOverrides: legacy.overrides,
    // RUNTIME_LOG_LEVEL=5 swaps in an executor that surfaces the runtime's own
    // logs, so a `wasm unreachable` trap tells you which pallet panicked.
    ...(process.env.RUNTIME_LOG_LEVEL ? { executor: verboseExecutor } : {}),
  });

  const { url, close } = await serve(fork);
  const client = createClient(
    getWsProvider(url, {
      // A fork sends nothing at all while it executes a block, and a cold first
      // block is ~70s of blocking wasm. papi's default 40s heartbeat reads that
      // silence as a dead socket, kills it, and re-sends the in-flight
      // dev_newBlock — so the fork builds duplicate blocks and the hash we're
      // waiting on never reaches finalizedBlock$.
      heartbeatTimeout: WARMUP_TIMEOUT,
    })
  );

  const spec = await client.getChainSpecData();
  c.log(`🥢 ${parachain.name} (${spec.name}) connected`);

  /**
   * `dev_newBlock` resolves as soon as the block is authored, which is before
   * chainHead has pushed it down to papi. Wait for the client to see it, so
   * callers can read state at the new head immediately.
   */
  const newBlock = async (params: NewBlockParams = {}): Promise<HexString> => {
    const hash = await client._request<HexString>('dev_newBlock', [params]);
    await firstValueFrom(
      client.finalizedBlock$.pipe(filter((b) => b.hash === hash))
    );
    return hash;
  };

  const dev = {
    newBlock,
    setStorage: async (values: DecodedStorage, blockHash?: string) =>
      client._request('dev_setStorage', [
        await encodeStorage(client, values),
        blockHash,
      ]),
  };

  const wasm = wasmOverrides?.[parachain.key];
  if (wasm) {
    const code = await readFile(wasm);
    await client._request('dev_setStorage', [
      [[CODE_KEY, `0x${code.toString('hex')}`]],
    ]);
    c.log(`🥢 ${parachain.name} runtime overridden.`);
  }

  const chainDecimals = firstOf(spec.properties?.tokenDecimals) ?? 12;
  await dev.setStorage(initStorage(chainDecimals, parachain) as DecodedStorage);
  c.log(`🥢 ${parachain.name} storage ready.`);

  return {
    url,
    fork,
    client,
    dev,
    config: parachain,
    async teardown() {
      client.destroy();
      legacy.destroy();
      fork.destroy();
      await close();
    },
    async pause() {
      await client._request('forklift_changeOptions', [
        { buildBlockMode: Enum('timer', 0) },
      ]);
      setTimeout(
        () =>
          c.log(
            `Test paused. Polkadot.js apps URL: https://polkadot.js.org/apps/?rpc=${url}`
          ),
        100
      );
      return new Promise<void>(() => {});
    },
  };
}

export async function createNetworks(
  chains: Parachain[],
  wasmOverrides?: Record<string, string>
): Promise<SetupCtx[]> {
  // Boot one at a time. Booting them together opens every upstream socket at
  // once — and since several chains share a provider (three of them are on
  // dwellir), that burst gets throttled: connections are refused, papi fails
  // over, and a chain can end up on a dead or slow endpoint for the rest of the
  // run. Connecting in sequence keeps each fork on the endpoint it asked for.
  const networks: SetupCtx[] = [];
  for (const chain of chains) {
    networks.push(await createNetwork(chain, wasmOverrides));
  }

  // forklift has no storage cache: it lazily pulls state from the upstream RPC
  // as the runtime asks for it, one key per round-trip. The first block on a
  // cold fork drags in the whole working set — seconds for most chains, a
  // couple of minutes for Hydration. Later blocks take ~3s. Pay that cost here
  // so it doesn't land inside a test's timeout.
  //
  // Warm one chain at a time. forklift runs the wasm executor on the main
  // thread, so warming several at once has them fighting over the same event
  // loop: each one's storage responses sit in the queue behind another's block
  // execution, and the round-trips they're already bound by inflate until the
  // whole thing crawls. Serially, every fork gets the loop to itself.
  c.log('🥢 Warming up forks (first block pulls state from upstream) ...');
  const started = Date.now();
  for (const n of networks) {
    const t = Date.now();
    c.log(`🥢   warming ${n.config.name} ...`);
    // Fail loudly and name the chain: a fork that can't author a block would
    // otherwise just hang until jest's hook timeout, telling you nothing.
    await withTimeout(
      n.dev.newBlock(),
      WARMUP_TIMEOUT,
      `${n.config.name}: first block did not complete`
    );
    c.log(`🥢   ${n.config.name} warm (${((Date.now() - t) / 1000).toFixed(0)}s)`);
  }
  c.log(`🥢 Forks warm (${((Date.now() - started) / 1000).toFixed(0)}s).`);

  const relaychain = networks.find(({ config }) => config.parachainId === 0);
  const parachains = networks.filter(({ config }) => config.parachainId > 0);

  // Vertical (UMP/DMP): each parachain attaches to the relay.
  if (relaychain) {
    for (const parachain of parachains) {
      await parachain.client._request('forklift_xcm_attach_relay', [
        relaychain.url,
      ]);
    }
  }

  // Horizontal (HRMP): attach each sibling pair once — the call wires both ways.
  for (let i = 0; i < parachains.length; i++) {
    for (let j = i + 1; j < parachains.length; j++) {
      await parachains[i].client._request('forklift_xcm_attach_sibling', [
        parachains[j].url,
      ]);
    }
  }

  return networks;
}
