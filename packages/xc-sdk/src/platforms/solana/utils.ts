import {
  AddressLookupTableAccount,
  Connection,
  MessageV0,
  TransactionInstruction,
  VersionedMessage,
} from '@solana/web3.js';

import { HumanizedIx } from './types';

/** Resolve address lookup tables of a versioned (V0) message. */
export async function getLookupTables(
  connection: Connection,
  message: VersionedMessage
): Promise<AddressLookupTableAccount[]> {
  if (message.version === 'legacy') {
    return [];
  }
  const luts = await Promise.all(
    message.addressTableLookups.map((acc) =>
      connection.getAddressLookupTable(acc.accountKey)
    )
  );
  return luts
    .map((lut) => lut.value)
    .filter((val): val is AddressLookupTableAccount => val !== null);
}

export function ixToHuman(
  instructions: TransactionInstruction[]
): HumanizedIx[] {
  return instructions.map((ix) => {
    return {
      program: ix.programId.toBase58(),
      data: ix.data.toString('hex'),
      keys: ix.keys.map((k) => k.pubkey.toBase58()),
    };
  });
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export function serializeV0(mssgV0: MessageV0): string {
  const mssgArray = mssgV0.serialize();
  return Buffer.from(mssgArray).toString('hex');
}

export function deserializeV0(mssgV0: string): MessageV0 {
  const mssgBuffer = Buffer.from(mssgV0, 'hex');
  const mssgArray = Uint8Array.from(mssgBuffer);
  return MessageV0.deserialize(mssgArray);
}
