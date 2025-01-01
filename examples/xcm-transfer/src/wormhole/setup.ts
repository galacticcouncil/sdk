import {
  applyChainsConfigConfigOverrides,
  ChainConfigOverrides,
  ChainContext,
  Network,
  Platform,
  PlatformToChains,
  ProtocolName,
} from '@wormhole-foundation/sdk-connect';

import {
  NativeAddressCtr,
  PlatformUtils,
  RpcConnection,
  Signer,
} from '@wormhole-foundation/sdk-connect';

import {
  EvmAddress,
  EvmChain,
  EvmPlatform,
  getEvmSigner,
} from '@wormhole-foundation/sdk-evm';

import {
  SolanaAddress,
  SolanaChain,
  SolanaPlatform,
  //getSolanaSignAndSendSigner,
  getSolanaSigner,
} from '@wormhole-foundation/sdk-solana';

import { getSolanaSignAndSendSigner } from './solana/signer';

interface PlatformDefinition<P extends Platform> {
  Platform: PlatformUtils<P>;
  Address: NativeAddressCtr;
  getChain: <N extends Network, C extends PlatformToChains<P>>(
    network: N,
    chain: C,
    overrides?: ChainConfigOverrides<N, C>
  ) => ChainContext<N, C, P>;
  getSigner: (
    rpc: RpcConnection<P>,
    key: string,
    ...args: any
  ) => Promise<Signer>;
  protocols: ProtocolLoaders;
}

type ProtocolLoaders = {
  [key in ProtocolName]?: () => Promise<any>;
};

const evm: PlatformDefinition<'Evm'> = {
  Address: EvmAddress,
  Platform: EvmPlatform,
  getChain: (network, chain, overrides?) =>
    new EvmChain(
      chain,
      new EvmPlatform(
        network,
        applyChainsConfigConfigOverrides(network, 'Evm', {
          [chain]: overrides,
        })
      )
    ),
  getSigner: getEvmSigner,
  protocols: {
    TokenBridge: () => import('@wormhole-foundation/sdk-evm-tokenbridge'),
  },
};

const solana: PlatformDefinition<'Solana'> = {
  Address: SolanaAddress,
  Platform: SolanaPlatform,
  getChain: (network, chain, overrides?) =>
    new SolanaChain(
      chain,
      new SolanaPlatform(
        network,
        applyChainsConfigConfigOverrides(network, 'Solana', {
          [chain]: overrides,
        })
      )
    ),
  getSigner: getSolanaSignAndSendSigner,
  protocols: {
    TokenBridge: () => import('@wormhole-foundation/sdk-solana-tokenbridge'),
  },
};

export async function loadProtocols<P extends Platform>(
  platform: PlatformDefinition<P>
): Promise<void> {
  try {
    let toLoad = Object.entries(platform.protocols);
    await Promise.all(toLoad.map(([, loaderFn]) => loaderFn()));
  } catch (e) {
    console.error('Failed to load required packages', e);
    throw e;
  }
}

export { evm, solana };
