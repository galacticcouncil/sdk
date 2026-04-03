// Encode Parachain junction for Moonbeam Multilocation struct
// Selector 0x00 + 4-byte parachain ID (big-endian)
export function encodeParachainJunction(id: number): `0x${string}` {
  return `0x00${id.toString(16).padStart(8, '0')}`;
}

// Encode PalletInstance junction for Moonbeam Multilocation struct
// Selector 0x04 + 1-byte pallet index
export function encodePalletInstanceJunction(index: number): `0x${string}` {
  return `0x04${index.toString(16).padStart(2, '0')}`;
}

// Encode GeneralIndex junction for Moonbeam Multilocation struct
// Selector 0x05 + 16-byte index (big-endian u128)
export function encodeGeneralIndexJunction(index: number): `0x${string}` {
  return `0x05${index.toString(16).padStart(32, '0')}`;
}
