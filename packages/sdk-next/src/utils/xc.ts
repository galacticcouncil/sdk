import { Buffer } from 'buffer';

export function convertToId(xcAddress: string): number {
  const addressBuffer = Buffer.from(xcAddress.replace('0x', ''), 'hex');
  const assetIdBuffer = addressBuffer.subarray(16);
  return assetIdBuffer.readUIntBE(0, assetIdBuffer.length);
}
