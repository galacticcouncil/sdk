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
  readonly client: PolkadotClient;
  private at: BlockAt;
  private wsProvider?: PublicClient;

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

  /**
   * EVM reads over the papi connection.
   *
   * - One shared client, so reads issued together share a batch
   * - A batch goes out as one `aggregate3` call through MultiView
   * - Batched reads run as `staticcall`, so only view reads belong here
   */
  getWsProvider(): PublicClient {
    if (!this.wsProvider) {
      this.wsProvider = createPublicClient({
        chain: this.chain,
        batch: { multicall: true },
        transport: custom({
          request: ({ method, params }) =>
            this.client._request(method, params || []),
        }),
      });
    }
    return this.wsProvider;
  }

  getSigner(address: string): WalletClient {
    return createWalletClient({
      account: address as `0x${string}`,
      chain: this.chain,
      transport: custom((window as any).ethereum),
    });
  }

  /**
   * Block-pinned EVM reads through the runtime's `EthereumRuntimeRPCApi`.
   *
   * @param at - block hash every read pins to; defaults to the client's own
   */
  getRPCAdapter(at: BlockAt = this.at): EvmRpcAdapter {
    return new EvmRpcAdapter(this.client, at);
  }
}
