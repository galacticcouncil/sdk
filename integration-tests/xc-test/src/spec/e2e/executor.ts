import { run_task } from '@acala-network/chopsticks-executor';
import { Binary } from 'polkadot-api';

import * as c from 'console';

/**
 * forklift's default executor hard-codes `runtimeLogLevel: 0`, so when the
 * runtime panics all you get is `wasm 'unreachable' instruction executed` —
 * the panic message itself is swallowed. This is the same executor with the
 * runtime's logging turned on, so a trap tells you *why*.
 */
const RUNTIME_LOG_LEVEL = Number(process.env.RUNTIME_LOG_LEVEL ?? 5);

const MIN_PREFIX_LEN = 32 * 2 + 2;

const createJsCallback = (storage: any, overlay: Record<string, any>) => ({
  async getStorage(key: string) {
    if (key in overlay) return overlay[key] ?? undefined;
    const value = await storage.getValue(key);
    return value ? Binary.toHex(value) : undefined;
  },
  async getNextKey(prefix: string, key: string) {
    prefix = prefix.length < MIN_PREFIX_LEN ? key.slice(0, MIN_PREFIX_LEN) : prefix;
    const descendants = await storage.getDescendantKeys(prefix);
    const allKeys = new Set<string>([
      ...descendants,
      ...Object.keys(overlay).filter(
        (k) => k.startsWith(prefix) && overlay[k] !== null
      ),
    ]);
    for (const k of Object.keys(overlay)) {
      if (overlay[k] === null) allKeys.delete(k);
    }
    const keys = [...allKeys].sort();
    const idx = keys.findIndex((k) => k > key);
    return idx >= 0 ? keys[idx] : undefined;
  },
  async offchainGetStorage() {
    return undefined;
  },
  async offchainTimestamp() {
    return Date.now();
  },
  async offchainRandomSeed() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    // papi types hex as a branded `string`, the executor as `0x${string}`.
    return Binary.toHex(bytes) as `0x${string}`;
  },
  async offchainSubmitTransaction() {
    return false;
  },
});

let nextTaskId = 0;

export const verboseExecutor: any = {
  async runRuntimeCall({
    storage,
    call,
    params,
    storageOverrides = {},
    mockSignatureHost = 0,
  }: any) {
    const task = {
      id: nextTaskId++,
      wasm: Binary.toHex(storage.code),
      calls: [[call, [params]]],
      mockSignatureHost,
      allowUnresolvedImports: true,
      runtimeLogLevel: RUNTIME_LOG_LEVEL,
      storageProofSize: 1e3,
    };

    const response: any = await run_task(task, createJsCallback(storage, storageOverrides));

    // The runtime's panic message is emitted as a *log*, not as the error — and
    // the logs are structured records, so joining them straight yields
    // "[object Object]". Print them on both paths, and print them before
    // throwing: on a trap they are the only thing that says why.
    const dump = (logs: unknown[]) => {
      if (!logs?.length) return;
      const lines = logs.map((l) =>
        typeof l === 'string' ? l : JSON.stringify(l)
      );
      c.log(`📜 ${call} runtime logs:\n  ${lines.join('\n  ')}`);
    };

    if (response.Error) {
      dump(response.Error?.runtimeLogs ?? response.Call?.runtimeLogs ?? []);
      c.error(`\n💥 runtime trap in ${call}: ${JSON.stringify(response.Error)}`);
      throw new Error(`Runtime call failed: ${JSON.stringify(response.Error)}`);
    }
    if (!response.Call) {
      throw new Error('Unexpected response format from runtime');
    }

    dump(response.Call.runtimeLogs ?? []);
    return response.Call;
  },

  async getRuntimeVersion(code: Uint8Array) {
    const { get_runtime_version } = await import('@acala-network/chopsticks-executor');
    return get_runtime_version(Binary.toHex(code));
  },

  async createProof(nodes: any, updates: any) {
    const { create_proof } = await import('@acala-network/chopsticks-executor');
    return create_proof(nodes, updates);
  },

  async decodeProof(trieRootHash: any, nodes: any) {
    const { decode_proof } = await import('@acala-network/chopsticks-executor');
    return decode_proof(trieRootHash, nodes);
  },
};
