import { CallType, NearTxOutcome } from '@galacticcouncil/xc-core';

import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha2';
import { base58 } from '@scure/base';

import { NearCall, NearFunctionCall } from './types';

/** `KeyType::ED25519` of keys & signatures. */
const ED25519 = 0;

/** `Action::FunctionCall` - its index in the protocol's action enum. */
const FUNCTION_CALL = 2;

const utf8 = (value: string) => new TextEncoder().encode(value);

/** Borsh writer for the few types a NEAR transaction is made of. */
class BorshWriter {
  private readonly chunks: Uint8Array[] = [];

  u8(value: number): this {
    return this.fixed(Uint8Array.of(value));
  }

  u32(value: number): this {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    return this.fixed(bytes);
  }

  u64(value: bigint): this {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigUint64(0, value, true);
    return this.fixed(bytes);
  }

  u128(value: bigint): this {
    return this.u64(value & 0xffffffffffffffffn).u64(value >> 64n);
  }

  fixed(bytes: Uint8Array): this {
    this.chunks.push(bytes);
    return this;
  }

  bytes(bytes: Uint8Array): this {
    return this.u32(bytes.length).fixed(bytes);
  }

  string(value: string): this {
    return this.bytes(utf8(value));
  }

  toBytes(): Uint8Array {
    const size = this.chunks.reduce((total, c) => total + c.length, 0);
    const out = new Uint8Array(size);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

/**
 * An ed25519 key a NEAR account signs with.
 *
 * - Read from the `ed25519:` base58 secret key near-cli and wallets export:
 *   the 32 byte seed, followed by its public key or alone
 */
export class NearKeyPair {
  readonly publicKey: Uint8Array;

  readonly #seed: Uint8Array;

  private constructor(seed: Uint8Array) {
    this.#seed = seed;
    this.publicKey = ed25519.getPublicKey(seed);
  }

  static fromSecretKey(secretKey: string): NearKeyPair {
    const [curve, encoded] = secretKey.split(':');
    if (curve !== 'ed25519' || !encoded) {
      throw new Error('Expected an ed25519: prefixed secret key');
    }

    const bytes = base58.decode(encoded);
    if (bytes.length !== 32 && bytes.length !== 64) {
      throw new Error('Expected a 32 or 64 byte ed25519 secret key');
    }

    const keyPair = new NearKeyPair(bytes.subarray(0, 32));
    const publicKey = bytes.subarray(32);
    if (publicKey.length && base58.encode(publicKey) !== keyPair.toString()) {
      throw new Error('Secret key does not match the public key it carries');
    }
    return keyPair;
  }

  /** Base58 public key, `ed25519:` prefixed - as NEAR names access keys. */
  getPublicKey(): string {
    return 'ed25519:' + this.toString();
  }

  sign(message: Uint8Array): Uint8Array {
    return ed25519.sign(message, this.#seed);
  }

  toString(): string {
    return base58.encode(this.publicKey);
  }
}

export interface NearTransaction {
  signerId: string;
  publicKey: Uint8Array;
  nonce: bigint;
  receiverId: string;
  blockHash: Uint8Array;
  actions: NearFunctionCall[];
}

/**
 * Borsh encoding of a NEAR transaction, function calls only.
 *
 * - Its sha256 is the transaction hash, and what the key signs
 */
export function encodeTransaction(tx: NearTransaction): Uint8Array {
  const writer = new BorshWriter()
    .string(tx.signerId)
    .u8(ED25519)
    .fixed(tx.publicKey)
    .u64(tx.nonce)
    .string(tx.receiverId)
    .fixed(tx.blockHash)
    .u32(tx.actions.length);

  for (const { methodName, args, gas, deposit } of tx.actions) {
    writer
      .u8(FUNCTION_CALL)
      .string(methodName)
      .bytes(utf8(JSON.stringify(args)))
      .u64(gas)
      .u128(deposit);
  }
  return writer.toBytes();
}

/**
 * Sign a NEAR transaction.
 *
 * @param tx - transaction to sign
 * @param keyPair - key of the signer account
 * @returns base58 transaction hash, and the borsh signed transaction
 */
export function signTransaction(
  tx: NearTransaction,
  keyPair: NearKeyPair
): { hash: string; signedTx: Uint8Array } {
  const encoded = encodeTransaction(tx);
  const digest = sha256(encoded);
  const signedTx = new BorshWriter()
    .fixed(encoded)
    .u8(ED25519)
    .fixed(keyPair.sign(digest))
    .toBytes();
  return { hash: base58.encode(digest), signedTx };
}

/** One transaction to one receiver, as a signable call. */
export function toNearCall(
  from: string,
  receiverId: string,
  actions: NearFunctionCall[]
): NearCall {
  return {
    from: from,
    data: JSON.stringify({ receiverId, actions }, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ),
    receiverId: receiverId,
    actions: actions,
    type: CallType.Near,
    // NEAR has no transaction simulation.
    dryRun: async () => undefined,
  };
}

/**
 * Receipts that failed anywhere in a transaction's tree.
 *
 * - A transaction succeeds around a failed callback, e.g. a token refunding a
 *   transfer its receiver refused
 */
export function getFailures(
  outcome: NearTxOutcome
): { executor: string; failure: unknown }[] {
  return [outcome.transaction_outcome, ...outcome.receipts_outcome].flatMap(
    ({ outcome: { executor_id, status } }) =>
      typeof status === 'object' && 'Failure' in status
        ? [{ executor: executor_id, failure: status.Failure }]
        : []
  );
}
