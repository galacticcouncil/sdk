import {
  AddressLookupTableAccount,
  Keypair,
  TransactionInstruction,
} from '@solana/web3.js';

import { BaseConfig, BaseConfigParams, CallType } from '../base';

/** A single signable solana transaction. */
export interface ProgramTx {
  instructions: TransactionInstruction[];
  signers: Keypair[];
  lookupTables?: AddressLookupTableAccount[];
}

export interface ProgramConfigParams extends Omit<BaseConfigParams, 'type'> {
  instructions: TransactionInstruction[];
  signers: Keypair[];
  /**
   * Transactions to sign & send before this one - [wrapNative?, transfer].
   * Solana caps transaction size, so a native wrap can't be folded into
   * the transfer it funds.
   */
  prerequisites?: ProgramTx[];
  lookupTables?: AddressLookupTableAccount[];
  rentReserve?: bigint;
}

export class ProgramConfig extends BaseConfig {
  readonly instructions: TransactionInstruction[];
  readonly signers: Keypair[];
  readonly prerequisites: ProgramTx[];
  readonly lookupTables: AddressLookupTableAccount[];
  readonly rentReserve: bigint;

  constructor({
    instructions,
    signers,
    prerequisites,
    lookupTables,
    rentReserve,
    ...other
  }: ProgramConfigParams) {
    super({ ...other, type: CallType.Solana });
    this.instructions = instructions;
    this.signers = signers;
    this.prerequisites = prerequisites ?? [];
    this.lookupTables = lookupTables ?? [];
    this.rentReserve = rentReserve ?? 0n;
  }
}
