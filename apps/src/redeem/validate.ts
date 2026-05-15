export type ChainKey = 'eth' | 'base' | 'mrl' | 'sol' | 'sui';

const EVM_RX = /^0x[0-9a-fA-F]{40}$/;
const SUI_RX = /^0x[0-9a-fA-F]{64}$/;
const SOL_RX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const PLACEHOLDERS: Record<ChainKey, string> = {
  eth: '0x… (20 bytes)',
  base: '0x… (20 bytes)',
  mrl: '0x… (20 bytes)',
  sol: 'Base58 Solana address',
  sui: '0x… (32 bytes)',
};

export const HINTS: Record<ChainKey, string> = {
  eth: 'Ethereum address that owns the bridged tokens.',
  base: 'Base address that owns the bridged tokens.',
  mrl: 'Moonbeam EVM address that initiates the MRL claim on Hydration.',
  sol: 'Solana wallet (e.g. Phantom) that owns the bridged tokens.',
  sui: 'Sui wallet (e.g. Phantom Sui) that owns the bridged tokens.',
};

export function validateAddress(
  chain: ChainKey,
  address: string
): string | null {
  if (!address) return 'Address is required.';
  switch (chain) {
    case 'eth':
    case 'base':
    case 'mrl':
      return EVM_RX.test(address)
        ? null
        : 'Expected a 20-byte 0x-prefixed EVM address.';
    case 'sui':
      return SUI_RX.test(address)
        ? null
        : 'Expected a 32-byte 0x-prefixed Sui address.';
    case 'sol':
      return SOL_RX.test(address) ? null : 'Expected a base58 Solana address.';
  }
}
