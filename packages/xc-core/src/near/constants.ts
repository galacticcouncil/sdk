/** Storage staked per byte an account occupies, yocto. A protocol constant. */
export const NEAR_STORAGE_BYTE_COST = 10n ** 19n;

const TGAS = 10n ** 12n;

/**
 * Gas prepaid on the calls the sdk sends.
 *
 * - Ceilings the sender must hold, not costs - unused gas is refunded
 * - What whm's scripts send with
 * - `transfer`: ft_transfer_call, the manager's ft_on_transfer (50 TGas
 *   reserved for the publish, its callback and a refund) and the token's
 *   ft_resolve_transfer
 * - `wrap`: storage_deposit or near_deposit on a wrap token, a storage write
 * - `complete`: the 85 TGas the contract reserves for verify_vaa, the storage
 *   view, on_verified with a registering pay out and its settlement, on top
 *   of its own run
 * - `payOut`: ft_transfer and its callback
 */
export const NearGas = {
  transfer: 150n * TGAS,
  wrap: 10n * TGAS,
  complete: 150n * TGAS,
  payOut: 100n * TGAS,
} as const;

/**
 * Deposits attached to the calls the sdk sends, yocto.
 *
 * - `oneYocto`: what NEP-141 takes on ft_transfer_call and the contract on
 *   claim, proving a full access key signed
 * - `complete`: a first time recipient's token registration (0.00125 near)
 *   and the contract's storage allowance (0.005 near); the rest is refunded
 */
export const NearDeposit = {
  oneYocto: 1n,
  complete: 10n ** 22n,
} as const;
