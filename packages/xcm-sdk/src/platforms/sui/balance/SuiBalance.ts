import { SuiQueryConfig } from '@galacticcouncil/xcm-core';

import { SuiClient } from '@mysten/sui/client';

export abstract class SuiBalance {
  readonly client: SuiClient;
  readonly config: SuiQueryConfig;

  constructor(client: SuiClient, config: SuiQueryConfig) {
    this.validateClient(client);
    this.validateConfig(config);
    this.client = client;
    this.config = config;
  }

  private validateClient(client: SuiClient) {
    if (!client) {
      throw new Error(`No client found`);
    }
  }

  private validateConfig(config: SuiQueryConfig) {
    if (!config.address) {
      throw new Error('Sui address is required');
    }
  }

  abstract getBalance(): Promise<bigint>;
  abstract getDecimals(): Promise<number>;
}
