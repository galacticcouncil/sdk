import { SolanaChain } from '@galacticcouncil/xc-core';

import { Connection } from '@solana/web3.js';

/**
 * Jito block engine - submission side of the bundle api.
 *
 * The two halves live in different places and neither serves the other:
 * `sendBundle`, `getTipAccounts` & `getInflightBundleStatuses` are here,
 * while `simulateBundle` is a jito-solana **validator** method and only
 * answers on an rpc running that fork. Point either one at the wrong
 * endpoint and it comes back "Method not found" / "Invalid method".
 */
const BLOCK_ENGINE = 'https://mainnet.block-engine.jito.wtf/api/v1/bundles';

type JitoBundleSimulationResponse = {
  context: {
    apiVersion: string;
    slot: number;
  };
  value: {
    summary:
      | 'succeeded'
      | {
          failed: {
            error: {
              TransactionFailure: [number[], string];
            };
            tx_signature: string;
          };
        };
    transactionResults: Array<{
      err: null | unknown;
      logs: string[];
      postExecutionAccounts: null | unknown;
      preExecutionAccounts: null | unknown;
      returnData: null | unknown;
      unitsConsumed: number;
    }>;
  };
};

type JitoBundleStatus = {
  context: {
    apiVersion: string;
    slot: number;
  };
  value: Array<{
    bundle_id: string;
    landed_slot: number;
    status: string;
  }>;
};

export class SolanaLilJit {
  readonly #connection: Connection;

  constructor(chain: SolanaChain) {
    this.#connection = chain.connection;
  }

  /**
   * Block engine call. Rate limited to one a second per ip, so a caller
   * that polls has to space its requests out.
   */
  async #request<T>(method: string, params: unknown[]): Promise<T> {
    const res = await fetch(BLOCK_ENGINE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });

    if (!res.ok) {
      throw new Error('jito ' + method + ': http ' + res.status);
    }

    const { error, result } = await res.json();
    if (error) {
      throw new Error('jito ' + method + ': ' + error.message);
    }
    if (result === undefined) {
      throw new Error('jito ' + method + ': empty result');
    }
    return result as T;
  }

  /**
   * Returns bundle id
   *
   * @see https://explorer.jito.wtf/bundle/${bundle_id}
   *
   * @param encoded base 64 encoded tx
   * @returns bundle id
   */
  async sendBundle(encoded: string[]): Promise<string> {
    // Bundles default to base58, and a base64 one is rejected as
    // undecodable unless the encoding is spelled out.
    return this.#request('sendBundle', [encoded, { encoding: 'base64' }]);
  }

  /**
   * Dry run a bundle against the chain rpc, not the block engine.
   *
   * The only way to see why a bundle would fail: a rejected one is simply
   * dropped, leaving a bundle id that never lands and nothing on chain to
   * inspect. Best effort - an rpc not running jito-solana has no such
   * method, and undefined means "not simulated", never "simulated clean".
   *
   * @param encoded - base64 transactions, in bundle order
   * @param skipSigVerify - simulate unsigned, to check before signing
   */
  async simulateBundle(
    encoded: string[],
    skipSigVerify = false
  ): Promise<JitoBundleSimulationResponse | undefined> {
    // The account config arrays are not optional, one entry per tx, and
    // null means "don't snapshot accounts for this one".
    const perTx = encoded.map(() => null);
    const { result, error } = await (this.#connection as any)._rpcRequest(
      'simulateBundle',
      [
        { encodedTransactions: encoded },
        {
          preExecutionAccountsConfigs: perTx,
          postExecutionAccountsConfigs: perTx,
          skipSigVerify: skipSigVerify,
        },
      ]
    );
    return error ? undefined : (result as JitoBundleSimulationResponse);
  }

  async getInflightBundleStatuses(
    bundleIds: string[]
  ): Promise<JitoBundleStatus> {
    return this.#request('getInflightBundleStatuses', [bundleIds]);
  }

  async getRegion(): Promise<string[]> {
    return this.#request('getRegions', []);
  }

  async getTipAccount(): Promise<string[]> {
    return this.#request('getTipAccounts', []);
  }
}
