import { BuildBlockMode, setupWithServer } from '@galacticcouncil/chopsticks';

import { createClient, PolkadotClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws';

import { ChainSpec } from './configs';

type Setup = Awaited<ReturnType<typeof setupWithServer>>;

export interface Fork {
  spec: ChainSpec;
  /** In-process chain - builds a block with self-contained txs, see `sendRawEthTx`. */
  chain: Setup['chain'];
  client: PolkadotClient;
  /** Websocket endpoint; the same port answers json-rpc over http, eth_* included. */
  url: string;
  /** Build one block, optionally injecting raw signed extrinsics; returns the block hash. */
  newBlock: (transactions?: string[]) => Promise<string>;
  /** dev_setStorage (bigints stringified automatically). */
  setStorage: (values: unknown) => Promise<unknown>;
  close: () => Promise<void>;
}

/**
 * Fork a single chain (chopsticks server + a papi client), Manual block mode so
 * `newBlock()` is deterministic. Signature verification is mocked so storage
 * can be driven directly. Reusable across probes/specs — see WHM's chopsticks.
 *
 * - `CHOPSTICKS_DB` caches fetched state for reruns, paying off together with
 *   `CHOPSTICKS_BLOCK` pinning the fork to one block
 */
export async function spawn(spec: ChainSpec): Promise<Fork> {
  const cache = {
    ...(process.env.CHOPSTICKS_DB ? { db: process.env.CHOPSTICKS_DB } : {}),
    ...(process.env.CHOPSTICKS_BLOCK
      ? { block: Number(process.env.CHOPSTICKS_BLOCK) }
      : {}),
  };

  const { chain, addr, close } = await setupWithServer({
    endpoint: spec.endpoint,
    port: spec.port ?? 8000,
    ...cache,
    'build-block-mode': BuildBlockMode.Manual,
    'mock-signature-host': true,
  });

  const url = `ws://${addr}`;
  const client = createClient(getWsProvider(url));
  await client.getFinalizedBlock(); // wait until chainHead is ready

  const newBlock = (transactions?: string[]): Promise<string> =>
    client._request('dev_newBlock', [transactions ? { transactions } : {}]);

  const setStorage = (values: unknown): Promise<unknown> =>
    client._request('dev_setStorage', [
      JSON.parse(
        JSON.stringify(values, (_k, v) =>
          typeof v === 'bigint' ? v.toString() : v
        )
      ),
    ]);

  return {
    spec,
    chain,
    client,
    url,
    newBlock,
    setStorage,
    async close() {
      client.destroy();
      await close();
    },
  };
}
