import { Buffer } from 'buffer';

export function convertToId(xc: string): number {
  const addressBuffer = Buffer.from(xc, 'hex');
  const assetIdBuffer = addressBuffer.subarray(16);
  return assetIdBuffer.readUIntBE(0, assetIdBuffer.length);
}
