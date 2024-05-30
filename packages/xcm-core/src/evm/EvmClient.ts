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

  get chainId(): number {
    return this.chain.id;
  }

  get chainCurrency(): string {
    return this.chain.nativeCurrency.symbol;
  }

  get chainDecimals(): number {
    return this.chain.nativeCurrency.decimals;
  }

  get chainHttps(): readonly string[] {
    return this.chain.rpcUrls.default.http;
  }

  get chainWss(): readonly string[] | undefined {
    return this.chain.rpcUrls.default.webSocket;
  }

  get chainExplorer(): string | undefined {
    return this.chain.blockExplorers?.default.url;
  }

  getProvider(): PublicClient {
    return createPublicClient({
      chain: this.chain,
      transport: http(),
    });
  }

  getWsProvider(): PublicClient {
    return createPublicClient({
      chain: this.chain,
      transport: webSocket(),
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
