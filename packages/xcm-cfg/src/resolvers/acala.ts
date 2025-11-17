import { EvmResolver } from '@galacticcouncil/xcm-core';

import { PolkadotClient } from 'polkadot-api';
import {
  Blake2256,
  getSs58AddressInfo,
} from '@polkadot-api/substrate-bindings';
import { toHex } from '@polkadot-api/utils';

const ETH_PREFIX = 'evm:';
const ETH_PREFIX_BYTES = new TextEncoder().encode(ETH_PREFIX);

export class AcalaEvmResolver implements EvmResolver {
  async toH160(ss58Addr: string, api?: PolkadotClient): Promise<string> {
    if (!api) {
      return this.toDefaultH160(ss58Addr);
    }

    try {
      const chainSpec = await api.getChainSpecData();
      const typedApi = api.getTypedApi(chainSpec.genesisHash as any);
      const h160Addr = await (typedApi.query as any).EvmAccounts.evm_addresses(
        ss58Addr
      );

      if (h160Addr) {
        return h160Addr;
      }
    } catch (e) {}

    return this.toDefaultH160(ss58Addr);
  }

  private toDefaultH160(ss58Addr: string) {
    const info = getSs58AddressInfo(ss58Addr);
    if (!info.isValid) {
      throw new Error('Invalid SS58 address');
    }
    const publicKey = info.publicKey;

    // Check if public key has EVM prefix (first 4 bytes match 'evm:')
    const hasEvmPrefix =
      publicKey.length >= 24 &&
      publicKey.slice(0, 4).every((byte, i) => byte === ETH_PREFIX_BYTES[i]);

    if (hasEvmPrefix) {
      // Extract H160 address (bytes 4-24)
      return toHex(publicKey.slice(4, 24));
    }

    // Compute H160 from blake2(concat('evm:', publicKey))
    const combined = new Uint8Array(ETH_PREFIX_BYTES.length + publicKey.length);
    combined.set(ETH_PREFIX_BYTES);
    combined.set(publicKey, ETH_PREFIX_BYTES.length);

    const hash = Blake2256(combined);
    return toHex(hash.slice(0, 20));
  }
}
