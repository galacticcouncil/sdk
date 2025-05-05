import { Buffer } from 'buffer';

export class ERC20Mapping {
  static encodeEvmAddress(assetId: number): string {
    const evmAddressBuffer = Buffer.alloc(20, 0);
    evmAddressBuffer[15] = 1;
    evmAddressBuffer.writeUInt32BE(assetId, 16);

    return '0x' + evmAddressBuffer.toString('hex');
  }

  static decodeEvmAddress(evmAddress: string): number {
    const addressBuffer = Buffer.from(evmAddress.replace('0x', ''), 'hex');
    if (addressBuffer.length !== 20 || !this.isAssetAddress(evmAddress)) {
      throw new Error('Unable to decode evm address');
    }
    return addressBuffer.readUInt32BE(16);
  }

  static isAssetAddress(address: string): boolean {
    const PREFIX_BUFFER = Buffer.from(
      '0000000000000000000000000000000100000000',
      'hex'
    );
    const addressBuffer = Buffer.from(address.replace('0x', ''), 'hex');
    if (addressBuffer.length !== 20) {
      return false;
    }
    return addressBuffer.subarray(0, 16).equals(PREFIX_BUFFER.subarray(0, 16));
  }
}
