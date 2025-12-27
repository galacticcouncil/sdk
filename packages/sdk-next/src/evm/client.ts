import { PolkadotClient } from 'polkadot-api';

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  Chain,
  PublicClient,
  WalletClient,
} from 'viem';

import { createChain } from './chain';
import { EvmRpcAdapter } from './adapter';

export class EvmClient {
  private client: PolkadotClient;

  readonly chain: Chain;

  constructor(client: PolkadotClient) {
    this.client = client;
    this.chain = createChain();
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
      transport: custom({
        request: ({ method, params }) =>
          this.client._request(method, params || []),
      }),
    });
  }

  getSigner(address: string): WalletClient {
    return createWalletClient({
      account: address as `0x${string}`,
      chain: this.chain,
      transport: custom((window as any).ethereum),
    });
  }

  getRPCAdapter(): EvmRpcAdapter {
    return new EvmRpcAdapter(this.client);
  }
}
