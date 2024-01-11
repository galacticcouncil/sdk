import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  Chain,
  PublicClient,
  WalletClient,
  webSocket,
} from 'viem';

export class EvmClient {
  readonly chain: Chain;

  constructor(chain: Chain) {
    this.chain = chain;
  }

  getProvider(): PublicClient {
    return createPublicClient({
      chain: this.chain,
      transport: http(),
    });
  }

  getSigner(address: string): WalletClient {
    return createWalletClient({
      account: address as `0x${string}`,
      chain: this.chain,
      transport: custom((window as any).ethereum),
    });
  }
}
