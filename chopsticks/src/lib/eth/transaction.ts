import { pad, type Hex, type parseTransaction } from 'viem';
import { Binary, Enum, type SizedHex } from 'polkadot-api';

import { type HydrationCalls } from '@galacticcouncil/descriptors';

/** The `transaction` argument of `Ethereum.transact` — the runtime's `TransactionV3` enum. */
export type TransactionV3 =
  HydrationCalls['Ethereum']['transact']['transaction'];
export type ParsedTx = ReturnType<typeof parseTransaction>;

const MASK64 = (1n << 64n) - 1n;

/** papi's U256 = little-endian `[u64;4]`, what the typed args expect. */
const u256 = (v: bigint): [bigint, bigint, bigint, bigint] => [
  v & MASK64,
  (v >> 64n) & MASK64,
  (v >> 128n) & MASK64,
  (v >> 192n) & MASK64,
];

/** Viem returns r/s as minimal hex; padded to 32 bytes so ecrecover finds the right signer. */
const sigRS = (p: { r?: Hex; s?: Hex }) => ({
  r: pad(p.r ?? '0x', { size: 32 }) as SizedHex<32>,
  s: pad(p.s ?? '0x', { size: 32 }) as SizedHex<32>,
});

/** The `ethereum::TransactionV3` variant of a viem-parsed transaction. */
export function buildTransactionV3(p: ParsedTx): TransactionV3 {
  const action = p.to ? Enum('Call', p.to as SizedHex<20>) : Enum('Create');
  if (p.type === 'eip1559') {
    return Enum('EIP1559', {
      chain_id: BigInt(p.chainId),
      nonce: u256(BigInt(p.nonce ?? 0)),
      max_priority_fee_per_gas: u256(p.maxPriorityFeePerGas ?? 0n),
      max_fee_per_gas: u256(p.maxFeePerGas ?? 0n),
      gas_limit: u256(p.gas ?? 0n),
      action,
      value: u256(p.value ?? 0n),
      input: Binary.fromHex(p.data ?? '0x'),
      access_list: [],
      signature: { odd_y_parity: p.yParity === 1, ...sigRS(p) },
    });
  }
  if (p.type === 'eip2930') {
    return Enum('EIP2930', {
      chain_id: BigInt(p.chainId),
      nonce: u256(BigInt(p.nonce ?? 0)),
      gas_price: u256(p.gasPrice ?? 0n),
      gas_limit: u256(p.gas ?? 0n),
      action,
      value: u256(p.value ?? 0n),
      input: Binary.fromHex(p.data ?? '0x'),
      access_list: [],
      signature: { odd_y_parity: p.yParity === 1, ...sigRS(p) },
    });
  }
  return Enum('Legacy', {
    nonce: u256(BigInt(p.nonce ?? 0)),
    gas_price: u256((p as { gasPrice?: bigint }).gasPrice ?? 0n),
    gas_limit: u256(p.gas ?? 0n),
    action,
    value: u256(p.value ?? 0n),
    input: Binary.fromHex(p.data ?? '0x'),
    signature: { v: p.v ?? 0n, ...sigRS(p) },
  });
}
