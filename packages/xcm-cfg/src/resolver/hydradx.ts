import { EvmResolver } from '@galacticcouncil/xcm-core';
import { decodeAddress } from '@polkadot/util-crypto';

const ETH_PREFIX = 'ETH\0';

export class HydraDxEvmResolver implements EvmResolver {
  async toH160(ss58Addr: string): Promise<string> {
    const decodedBytes = decodeAddress(ss58Addr);
    const prefixBytes = Buffer.from(ETH_PREFIX);
    const addressBytes = decodedBytes.slice(prefixBytes.length, -8);
    return '0x' + Buffer.from(addressBytes).toString('hex');
  }
}
