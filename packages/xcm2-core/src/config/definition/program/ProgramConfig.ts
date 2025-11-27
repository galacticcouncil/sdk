import { Keypair, TransactionInstruction } from '@solana/web3.js';

import { BaseConfig, BaseConfigParams, CallType } from '../base';

export interface ProgramConfigParams extends Omit<BaseConfigParams, 'type'> {
  instructions: TransactionInstruction[];
  signers: Keypair[];
}

export class ProgramConfig extends BaseConfig {
  readonly instructions: TransactionInstruction[];
  readonly signers: Keypair[];

  constructor({ instructions, signers, ...other }: ProgramConfigParams) {
    super({ ...other, type: CallType.Solana });
    this.instructions = instructions;
    this.signers = signers;
  }
}
