import { SolanaAddress } from '@wormhole-foundation/sdk-solana';

import { SolanaBalance } from './SolanaBalance';

const NATIVE_DECIMALS = 9;

export class Native extends SolanaBalance {
  async getBalance(): Promise<bigint> {
    const { address } = this.config;

    const senderAddress = new SolanaAddress(address).unwrap();
    const balance = await this.connection.getBalance(senderAddress);
    return BigInt(balance);
  }

  async getDecimals(): Promise<number> {
    return NATIVE_DECIMALS;
  }
}
