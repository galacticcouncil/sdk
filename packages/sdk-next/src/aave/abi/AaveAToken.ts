/**
 * aToken reads the SDK relies on.
 *
 * - `getFreeBalance` exists only on `LockableAToken` (GIGAHDX)
 * - A plain aToken reverts `getFreeBalance`
 */
export const AAVE_ATOKEN_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'getFreeBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
