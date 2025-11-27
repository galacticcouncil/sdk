import { EvmBalance } from './EvmBalance';

export class Native extends EvmBalance {
  async getBalance(): Promise<bigint> {
    const provider = this.client.getProvider();
    const { address } = this.config;

    return provider.getBalance({
      address: address as `0x${string}`,
    });
  }

  async getDecimals(): Promise<number> {
    return this.client.chain.nativeCurrency.decimals;
  }
}
