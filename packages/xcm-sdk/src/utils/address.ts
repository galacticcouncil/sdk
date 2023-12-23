export function isEthAddress(address: string) {
  if (address) {
    return address.length === 42 && address.startsWith('0x');
  }
  return false;
}
