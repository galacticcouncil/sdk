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
import { BlockAt } from '../api';

export class EvmClient {
  private client: PolkadotClient;
  private at: BlockAt;

  readonly chain: Chain;

  constructor(client: PolkadotClient, at: BlockAt = 'best') {
    this.client = client;
    this.at = at;
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
    return new EvmRpcAdapter(this.client, this.at);
  }
}
