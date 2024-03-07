import { EvmBalance } from './EvmBalance';

export class Native extends EvmBalance {
  async getBalance(): Promise<bigint> {
    const provider = this.client.getProvider();
    const { args } = this.config;
    const [recipient] = args;

    return provider.getBalance({
      address: recipient as `0x${string}`,
    });
  }

  async getDecimals(): Promise<number> {
    return this.client.chain.nativeCurrency.decimals;
  }
}
