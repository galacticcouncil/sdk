/**
 * Naming conversion utilities for PAPI unsafe API
 *
 * These utilities convert config-style names to PAPI runtime names.
 * Used when working with unsafe API for generic chain support.
 */

/**
 * Convert string to PascalCase (first letter uppercase)
 * Used for pallet names and query function names in PAPI
 * @example
 * toPascalCase('balances') // 'Balances'
 * toPascalCase('polkadotXcm') // 'PolkadotXcm'
 * toPascalCase('multiTransactionPayment') // 'MultiTransactionPayment'
 */
export function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert camelCase string to snake_case
 * Used for extrinsic/function names in PAPI
 * @example
 * toSnakeCase('transferAll') // 'transfer_all'
 * toSnakeCase('batchAll') // 'batch_all'
 * toSnakeCase('setSufficient') // 'set_sufficient'
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, ''); // Remove leading underscore if present
}
