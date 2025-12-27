import { ApiPromise } from '@polkadot/api';

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
import { pjsWebSocket } from './transport';

import { EvmRpcAdapter } from './adapter';

export class EvmClient {
  private api: ApiPromise;

  readonly chain: Chain;

  constructor(api: ApiPromise) {
    this.api = api;
    this.chain = createChain(this.provider);
  }

  get provider() {
    const { provider } = (this.api as any)._options;
    return provider;
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
      transport: pjsWebSocket(this.provider),
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
    return new EvmRpcAdapter(this.api);
  }
}
