import { ContractConfig, EvmClient } from '@galacticcouncil/xcm2-core';

export abstract class EvmBalance {
  readonly client: EvmClient;
  readonly config: ContractConfig;

  constructor(client: EvmClient, config: ContractConfig) {
    this.validateClient(client);
    this.validateConfig(config);
    this.client = client;
    this.config = config;
  }

  private validateClient(client: EvmClient) {
    if (!client) {
      throw new Error(`No EVM client found`);
    }
  }

  private validateConfig(config: ContractConfig) {
    if (!config.address) {
      throw new Error('Contract address is required');
    }
  }

  abstract getBalance(): Promise<bigint>;
  abstract getDecimals(): Promise<number>;
}
