import {
  AddressLookupTableAccount,
  Keypair,
  TransactionInstruction,
} from '@solana/web3.js';

import { BaseConfig, BaseConfigParams, CallType } from '../base';

export interface ProgramConfigParams extends Omit<BaseConfigParams, 'type'> {
  instructions: TransactionInstruction[];
  signers: Keypair[];
  lookupTables?: AddressLookupTableAccount[];
  rentReserve?: bigint;
}

/** A single signable solana transaction. */
export class ProgramConfig extends BaseConfig {
  readonly instructions: TransactionInstruction[];
  readonly signers: Keypair[];
  readonly lookupTables: AddressLookupTableAccount[];
  readonly rentReserve: bigint;

  constructor({
    instructions,
    signers,
    lookupTables,
    rentReserve,
    ...other
  }: ProgramConfigParams) {
    super({ ...other, type: CallType.Solana });
    this.instructions = instructions;
    this.signers = signers;
    this.lookupTables = lookupTables ?? [];
    this.rentReserve = rentReserve ?? 0n;
  }
}
