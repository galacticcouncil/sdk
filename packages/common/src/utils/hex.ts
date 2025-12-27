const RE_HEX = /^0x[0-9a-fA-F]*$/;

export function isHex(value: string, ignoreLength = false): boolean {
  if (value === '0x') return true;
  if (!RE_HEX.test(value)) return false;
  if (!ignoreLength && value.length < 4) return false;
  return ignoreLength || value.length % 2 === 0;
}

export function stripHexPrefix(hex: string): string {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

export function ensureHexPrefix(hex: string): string {
  return hex.startsWith('0x') ? hex : `0x${hex}`;
}

export function hexNormalize(h: string): string {
  return ensureHexPrefix(h.toLowerCase());
}

export function assertHexLen(h: string, bytes: number): void {
  if (!isHex(h) || h.length - 2 !== bytes * 2) {
    throw new Error(`Expected 0x hex of ${bytes} bytes`);
  }
}
