import {
  createPublicClient,
  createWalletClient,
  custom,
  fallback,
  http,
  Chain,
  PublicClient,
  WalletClient,
  webSocket,
} from 'viem';

export class EvmClient {
  readonly chain: Chain;
  readonly rpcs: string[];

  constructor(chain: Chain, rpcs?: string[]) {
    this.chain = chain;
    this.rpcs = rpcs || [];
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
    const withFallback = this.rpcs.map((rpc) => http(rpc));
    return createPublicClient({
      chain: this.chain,
      transport: this.rpcs.length > 0 ? fallback(withFallback) : http(),
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
