import { ProgramConfig } from '@galacticcouncil/xcm2-core';

import { Connection } from '@solana/web3.js';

import { SolanaTransfer } from './SolanaTransfer';

export class SolanaTransferFactory {
  static get(connection: Connection, config: ProgramConfig): SolanaTransfer {
    return new SolanaTransfer(connection, config);
  }
}
