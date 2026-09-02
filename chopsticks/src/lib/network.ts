import { BuildBlockMode, setupWithServer } from '@acala-network/chopsticks';

import { createClient, PolkadotClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws';

import { ChainSpec } from './configs';

export interface Fork {
  spec: ChainSpec;
  client: PolkadotClient;
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
 */
export async function spawn(spec: ChainSpec): Promise<Fork> {
  const { addr, close } = await setupWithServer({
    endpoint: spec.endpoint,
    port: spec.port ?? 8000,
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
