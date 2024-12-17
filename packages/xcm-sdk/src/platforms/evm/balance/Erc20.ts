import { ContractConfig, EvmClient } from '@galacticcouncil/xcm-core';

import { EvmBalance } from './EvmBalance';

import { Erc20Client } from '../Erc20Client';

export class Erc20 extends EvmBalance {
  readonly erc20: Erc20Client;

  constructor(client: EvmClient, config: ContractConfig) {
    super(client, config);
    this.erc20 = new Erc20Client(client, config.address);
  }

  async getBalance(): Promise<bigint> {
    const { args } = this.config;
    const [account] = args;
    return this.erc20.balanceOf(account);
  }

  async getDecimals(): Promise<number> {
    return this.erc20.decimals();
  }
}
