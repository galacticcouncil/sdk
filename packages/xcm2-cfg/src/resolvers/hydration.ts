import { EvmResolver } from '@galacticcouncil/xcm2-core';
import { getSs58AddressInfo } from '@polkadot-api/substrate-bindings';

const ETH_PREFIX = 'ETH\0';

export class HydrationEvmResolver implements EvmResolver {
  async toH160(ss58Addr: string): Promise<string> {
    const info = getSs58AddressInfo(ss58Addr);
    if (!info.isValid) {
      throw new Error(`Invalid SS58 address: ${ss58Addr}`);
    }

    const decodedBytes = info.publicKey;
    const prefixBytes = Buffer.from(ETH_PREFIX);
    const addressBytes = decodedBytes.slice(prefixBytes.length, -8);
    return '0x' + Buffer.from(addressBytes).toString('hex');
  }
}
