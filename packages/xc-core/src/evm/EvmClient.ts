import {
  createPublicClient,
  createWalletClient,
  custom,
  fallback,
  http,
  webSocket,
  Chain,
  PublicClient,
  WalletClient,
} from 'viem';

export class EvmClient {
  readonly chain: Chain;
  readonly rpcs: string[];

  private provider?: PublicClient;

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

  get chainExplorer(): string | undefined {
    return this.chain.blockExplorers?.default.url;
  }

  /**
   * Memoized. Viem keys both the block-watch dedupe and the multicall
   * scheduler on client identity, so a fresh client per call turns N asset
   * reads into N pollers and defeats batching.
   */
  getProvider(): PublicClient {
    if (this.provider) {
      return this.provider;
    }

    const withFallback = this.rpcs.map((rpc) => http(rpc));
    this.provider = createPublicClient({
      batch: { multicall: true },
      chain: this.chain,
      transport:
        this.rpcs.length > 0
          ? fallback(withFallback, {
              rank: false,
            })
          : http(),
    });
    return this.provider;
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
