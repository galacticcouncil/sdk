// SCALE compact integer: the two low bits of the first byte encode the mode.
// 0b00 → single-byte, value = byte >> 2
// 0b01 → two-byte LE, value = u16 >> 2
// 0b10 → four-byte LE, value = u32 >> 2
// 0b11 → big-int (length prefix), not decoded here
export function decodeCompactLength(hex: string): number {
  const body = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (body.length < 2) return 0;

  const firstByte = parseInt(body.slice(0, 2), 16);
  const mode = firstByte & 0b11;

  switch (mode) {
    case 0b00:
      return firstByte >> 2;
    case 0b01: {
      if (body.length < 4) return 0;
      const lo = firstByte;
      const hi = parseInt(body.slice(2, 4), 16);
      return ((hi << 8) | lo) >> 2;
    }
    case 0b10: {
      if (body.length < 8) return 0;
      const b0 = firstByte;
      const b1 = parseInt(body.slice(2, 4), 16);
      const b2 = parseInt(body.slice(4, 6), 16);
      const b3 = parseInt(body.slice(6, 8), 16);
      return ((b3 << 24) | (b2 << 16) | (b1 << 8) | b0) >>> 2;
    }
    default:
      return 0;
  }
}
