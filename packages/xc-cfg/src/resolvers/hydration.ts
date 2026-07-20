import { EvmResolver } from '@galacticcouncil/xc-core';
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

    // Mirrors pallet-evm-accounts `evm_address`: EVM-flavored accounts
    // ("ETH\0" + h160 + 8 zero bytes) unwrap to the embedded h160, native
    // substrate accounts truncate to the first 20 bytes.
    const isEvmAccount =
      Buffer.from(decodedBytes.slice(0, prefixBytes.length)).equals(
        prefixBytes
      ) && decodedBytes.slice(-8).every((byte) => byte === 0);

    const addressBytes = isEvmAccount
      ? decodedBytes.slice(prefixBytes.length, -8)
      : decodedBytes.slice(0, 20);
    return '0x' + Buffer.from(addressBytes).toString('hex');
  }
}
