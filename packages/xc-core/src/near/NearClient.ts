import { base64 } from '@scure/base';

import {
  NearAccessKeyView,
  NearAccountView,
  NearStateItem,
  NearTxOutcome,
} from './types';

interface RpcErrorBody {
  name?: string;
  cause?: { name?: string; info?: unknown };
  message?: string;
  data?: unknown;
}

type Finality = 'final' | 'optimistic';

/** The rpc reports an account that was never created as an error. */
const UNKNOWN_ACCOUNT = 'UNKNOWN_ACCOUNT';

/** The rpc gave up waiting, the transaction itself may still land. */
const TIMEOUT_ERROR = 'TIMEOUT_ERROR';

/** Status polls past an rpc timeout, each waiting as long as the rpc. */
const TX_STATUS_POLLS = 5;

const toUtf8 = (value: string) => new TextEncoder().encode(value);
const fromUtf8 = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

/** Json-rpc error, typed by the nearcore cause it names. */
export class NearRpcError extends Error {
  /** Nearcore cause, e.g. `UNKNOWN_ACCOUNT` or `INVALID_TRANSACTION`. */
  readonly type?: string;

  constructor(error: RpcErrorBody) {
    const type = error.cause?.name ?? error.name;
    const detail = error.data ?? error.cause?.info ?? error.message;
    super(`near rpc ${type ?? 'error'}: ${JSON.stringify(detail)}`);
    this.name = 'NearRpcError';
    this.type = type;
  }
}

/**
 * NEAR json-rpc, with no client library.
 *
 * - Views read the last final block unless told otherwise
 * - A submit returns once included, its outcome is read separately
 */
export class NearClient {
  readonly rpc: string;

  constructor(rpc: string) {
    this.rpc = rpc;
  }

  async request<T>(method: string, params: unknown): Promise<T> {
    const res = await fetch(this.rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 'xc', method, params }),
    });

    if (!res.ok) {
      throw new Error(`near rpc ${res.status}: ${await res.text()}`);
    }

    const body = (await res.json()) as { result?: T; error?: RpcErrorBody };
    if (body.error) {
      throw new NearRpcError(body.error);
    }
    return body.result as T;
  }

  query<T>(
    params: Record<string, unknown>,
    finality: Finality = 'final'
  ): Promise<T> {
    return this.request<T>('query', { finality, ...params });
  }

  /**
   * Call a view method.
   *
   * - A contract panic comes back as an error string, thrown here
   *
   * @param contractId - contract to query
   * @param method - view method name
   * @param args - json arguments
   */
  async view<T>(
    contractId: string,
    method: string,
    args: object = {}
  ): Promise<T> {
    const { result, error } = await this.query<{
      result?: number[];
      error?: string;
    }>({
      request_type: 'call_function',
      account_id: contractId,
      method_name: method,
      args_base64: base64.encode(toUtf8(JSON.stringify(args))),
    });

    if (error || !result) {
      throw new Error(`near view ${contractId}.${method}: ${error}`);
    }
    return JSON.parse(fromUtf8(Uint8Array.from(result))) as T;
  }

  /**
   * Account state, or undefined for an account that does not exist.
   *
   * @param accountId - account to read
   */
  async viewAccount(accountId: string): Promise<NearAccountView | undefined> {
    try {
      return await this.query<NearAccountView>({
        request_type: 'view_account',
        account_id: accountId,
      });
    } catch (err) {
      if (err instanceof NearRpcError && err.type === UNKNOWN_ACCOUNT) {
        return undefined;
      }
      throw err;
    }
  }

  /**
   * Access key of an account, for its nonce.
   *
   * - Reads the optimistic block, so a transaction sent a moment ago counts
   *
   * @param accountId - key owner
   * @param publicKey - `ed25519:` prefixed base58 public key
   */
  viewAccessKey(
    accountId: string,
    publicKey: string
  ): Promise<NearAccessKeyView> {
    return this.query<NearAccessKeyView>(
      {
        request_type: 'view_access_key',
        account_id: accountId,
        public_key: publicKey,
      },
      'optimistic'
    );
  }

  /**
   * Raw contract storage under a key prefix.
   *
   * - Nodes refuse contracts holding more data than their view limit, 50kB
   *   by default
   *
   * @param accountId - contract to read
   * @param prefix - storage key prefix
   */
  async viewState(
    accountId: string,
    prefix: Uint8Array
  ): Promise<NearStateItem[]> {
    const { values } = await this.query<{
      values: { key: string; value: string }[];
    }>({
      request_type: 'view_state',
      account_id: accountId,
      prefix_base64: base64.encode(prefix),
    });

    return values.map(({ key, value }) => ({
      key: base64.decode(key),
      value: base64.decode(value),
    }));
  }

  /** Hash of the last final block, base58. */
  async getBlockHash(): Promise<string> {
    const { header } = await this.request<{ header: { hash: string } }>(
      'block',
      { finality: 'final' }
    );
    return header.hash;
  }

  /** Current gas price, yocto per gas unit. */
  async getGasPrice(): Promise<bigint> {
    const { gas_price } = await this.request<{ gas_price: string }>(
      'gas_price',
      [null]
    );
    return BigInt(gas_price);
  }

  /**
   * Submit a signed transaction.
   *
   * - Resolves once a block includes it, well before it executes
   * - An invalid transaction (nonce, balance, signature) is thrown here
   * - An rpc timeout resolves too, the transaction was accepted and may
   *   still land - {@link getTransaction} tells
   *
   * @param signedTx - borsh encoded signed transaction
   */
  async sendTransaction(signedTx: Uint8Array): Promise<void> {
    try {
      await this.request('send_tx', {
        signed_tx_base64: base64.encode(signedTx),
        wait_until: 'INCLUDED',
      });
    } catch (err) {
      if (!(err instanceof NearRpcError) || err.type !== TIMEOUT_ERROR) {
        throw err;
      }
    }
  }

  /**
   * Final execution outcome of a transaction.
   *
   * - Waits for the whole receipt tree, polling past rpc timeouts
   *
   * @param hash - transaction hash, base58
   * @param signerId - signing account
   */
  async getTransaction(hash: string, signerId: string): Promise<NearTxOutcome> {
    for (let poll = 1; ; poll++) {
      try {
        return await this.request<NearTxOutcome>('tx', {
          tx_hash: hash,
          sender_account_id: signerId,
          wait_until: 'FINAL',
        });
      } catch (err) {
        const isTimeout =
          err instanceof NearRpcError && err.type === TIMEOUT_ERROR;
        if (!isTimeout || poll === TX_STATUS_POLLS) {
          throw err;
        }
      }
    }
  }
}
