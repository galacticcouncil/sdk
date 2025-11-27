import { SolanaQueryConfig } from '@galacticcouncil/xcm-core';

import { Connection } from '@solana/web3.js';

export abstract class SolanaBalance {
  readonly connection: Connection;
  readonly config: SolanaQueryConfig;

  constructor(connection: Connection, config: SolanaQueryConfig) {
    this.validateConnection(connection);
    this.validateConfig(config);
    this.connection = connection;
    this.config = config;
  }

  private validateConnection(connection: Connection) {
    if (!connection) {
      throw new Error(`No connection found`);
    }
  }

  private validateConfig(config: SolanaQueryConfig) {
    if (!config.address) {
      throw new Error('Solana address is required');
    }
  }

  abstract getBalance(): Promise<bigint>;
  abstract getDecimals(): Promise<number>;
}
