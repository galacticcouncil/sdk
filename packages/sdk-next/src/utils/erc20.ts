import { Buffer } from 'buffer';

export function convertToId(erc20: string): number {
  const addressBuffer = Buffer.from(erc20, 'hex');
  const assetIdBuffer = addressBuffer.subarray(16);
  return assetIdBuffer.readUIntBE(0, assetIdBuffer.length);
}
