export class ERC20Mapping {
  static encodeEvmAddress(assetId: string) {
    const id = Number(assetId);
    const evmAddressBuffer = Buffer.alloc(20, 0);
    evmAddressBuffer[15] = 1;
    evmAddressBuffer.writeUInt32BE(id, 16);

    return '0x' + evmAddressBuffer.toString('hex');
  }

  static decodeEvmAddress(evmAddress: string) {
    const addressBuffer = Buffer.from(evmAddress.replace('0x', ''), 'hex');
    if (addressBuffer.length !== 20 || !this.isAssetAddress(evmAddress)) {
      return null;
    }
    return addressBuffer.readUInt32BE(16);
  }

  static isAssetAddress(address: string) {
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
