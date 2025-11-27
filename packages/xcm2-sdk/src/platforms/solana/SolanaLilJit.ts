import { SolanaChain } from '@galacticcouncil/xcm2-core';

import { Connection } from '@solana/web3.js';

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
   * Returns bundle id
   *
   * @see https://explorer.jito.wtf/bundle/${bundle_id}
   *
   * @param encoded base 64 encoded tx
   * @returns bundle id
   */
  async sendBundle(encoded: string[]): Promise<string> {
    const { result } = await (this.#connection as any)._rpcRequest(
      'sendBundle',
      [encoded]
    );
    return result;
  }

  async simulateBundle(
    encoded: string[]
  ): Promise<JitoBundleSimulationResponse> {
    const { result } = await (this.#connection as any)._rpcRequest(
      'simulateBundle',
      [[encoded]]
    );
    return result;
  }

  async getInflightBundleStatuses(
    bundleIds: string[]
  ): Promise<JitoBundleStatus> {
    const { result } = await (this.#connection as any)._rpcRequest(
      'getInflightBundleStatuses',
      [bundleIds]
    );
    return result;
  }

  async getRegion(): Promise<string[]> {
    const { result } = await (this.#connection as any)._rpcRequest(
      'getRegions',
      []
    );
    return result;
  }

  async getTipAccount(): Promise<string[]> {
    const { result } = await (this.#connection as any)._rpcRequest(
      'getTipAccounts',
      []
    );
    return result;
  }
}
