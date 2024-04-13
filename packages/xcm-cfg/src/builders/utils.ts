/**
 * Format recipient address on the destination chain in 32 bytes (left padded)
 *
 * @param address 20 bytes 0x address
 * @returns 32 bytes 0x address
 */
export function formatDestAddress(address: string) {
  return '0x000000000000000000000000' + address.substring(2);
}
