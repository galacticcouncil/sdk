/**
 * Naming conversion utilities for PAPI unsafe API
 *
 * These utilities convert config-style names to PAPI runtime names.
 * Used when working with unsafe API for generic chain support.
 */

/**
 * Convert pallet/module name to PAPI format
 * @example
 * toPalletName('balances') // 'Balances'
 * toPalletName('polkadotXcm') // 'PolkadotXcm'
 * toPalletName('multiTransactionPayment') // 'MultiTransactionPayment'
 */
export function toPalletName(pallet: string): string {
  return pallet.charAt(0).toUpperCase() + pallet.slice(1);
}

/**
 * Convert extrinsic/function name to PAPI snake_case format
 * @example
 * toExtrinsicName('transferAll') // 'transfer_all'
 * toExtrinsicName('batchAll') // 'batch_all'
 * toExtrinsicName('setSufficient') // 'set_sufficient'
 */
export function toExtrinsicName(func: string): string {
  return func
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, ''); // Remove leading underscore if present
}
