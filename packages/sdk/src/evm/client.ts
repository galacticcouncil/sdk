import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  webSocket,
  Chain,
  PublicClient,
  WalletClient,
} from 'viem';

import { evmMainnet } from './chain';

export class EvmClient {
  readonly chain: Chain;

  constructor(chain?: Chain) {
    this.chain = chain ? chain : evmMainnet;
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
