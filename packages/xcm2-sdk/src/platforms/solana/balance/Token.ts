import { SolanaAddress } from '@wormhole-foundation/sdk-solana';
import { SolanaQueryConfig } from '@galacticcouncil/xcm2-core';

import { Connection } from '@solana/web3.js';

import { SolanaBalance } from './SolanaBalance';

export class Token extends SolanaBalance {
  constructor(connection: Connection, config: SolanaQueryConfig) {
    super(connection, config);
    this.validateToken(config);
  }

  async getBalance(): Promise<bigint> {
    const { address, token } = this.config;

    const senderAddress = new SolanaAddress(address).unwrap();
    const mintAddress = new SolanaAddress(token!).unwrap();

    const accounts = await this.connection.getParsedTokenAccountsByOwner(
      senderAddress,
      { mint: mintAddress }
    );

    return accounts.value.reduce((sum: bigint, { account }) => {
      const t = account.data.parsed.info.tokenAmount;
      sum += BigInt(t.amount);
      return sum;
    }, 0n);
  }

  async getDecimals(): Promise<number> {
    const { token } = this.config;

    const mintAddress = new SolanaAddress(token!).unwrap();

    const supply = await this.connection.getTokenSupply(mintAddress);
    return supply.value.decimals;
  }

  private validateToken(config: SolanaQueryConfig) {
    if (!config.token) {
      throw new Error('Token address is required');
    }
  }
}
