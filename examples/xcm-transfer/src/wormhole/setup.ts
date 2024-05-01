import type { Platform } from '@wormhole-foundation/sdk-connect';
import {
  NativeAddressCtr,
  PlatformUtils,
  RpcConnection,
  Signer,
} from '@wormhole-foundation/sdk-connect';

import {
  EvmAddress,
  EvmPlatform,
  getEvmSigner,
} from '@wormhole-foundation/sdk-evm';

import '@wormhole-foundation/sdk-evm-tokenbridge';

export interface PlatformDefinition<P extends Platform> {
  Platform: PlatformUtils<P>;
  Address: NativeAddressCtr;
  getSigner: (
    rpc: RpcConnection<P>,
    key: string,
    ...args: any
  ) => Promise<Signer>;
  protocolLoaders: {
    [key: string]: () => Promise<any>;
  };
}

export type PlatformLoader<P extends Platform> = () => Promise<
  PlatformDefinition<P>
>;

const evm: PlatformDefinition<'Evm'> = {
  Address: EvmAddress,
  Platform: EvmPlatform,
  getSigner: getEvmSigner,
  protocolLoaders: {
    tokenbridge: () => import('@wormhole-foundation/sdk-evm-tokenbridge'),
  },
};

export default evm;
