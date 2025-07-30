import { ApiPromise, WsProvider } from '@polkadot/api';

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

export class EvmClient {
  private wsProvider: WsProvider;

  readonly chain: Chain;

  constructor(api: ApiPromise) {
    const { provider } = (api as any)._options;

    this.wsProvider = provider as WsProvider;
    this.chain = createChain(provider);
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
      transport: pjsWebSocket(this.wsProvider),
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
