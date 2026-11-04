export const HOLLAR_BASE_VAULT = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes32', name: 'recipient', type: 'bytes32' },
    ],
    name: 'deposit',
    outputs: [{ internalType: 'uint64', name: 'sequence', type: 'uint64' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'depositAllowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'depositsPaused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'payoutAllowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'redeemFeeBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  { inputs: [], name: 'DepositsPaused', type: 'error' },
  {
    inputs: [
      { internalType: 'uint256', name: 'provided', type: 'uint256' },
      { internalType: 'uint256', name: 'required', type: 'uint256' },
    ],
    name: 'InsufficientMessageFee',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'raw', type: 'bytes32' }],
    name: 'NotAnAddress',
    type: 'error',
  },
  { inputs: [], name: 'OracleNotConfigured', type: 'error' },
  {
    inputs: [{ internalType: 'int256', name: 'answer', type: 'int256' }],
    name: 'OraclePriceInvalid',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'requested', type: 'uint256' },
      { internalType: 'uint256', name: 'available', type: 'uint256' },
    ],
    name: 'RateLimitExceeded',
    type: 'error',
  },
  { inputs: [], name: 'RefundFailed', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'price', type: 'uint256' },
      { internalType: 'uint256', name: 'floorPrice', type: 'uint256' },
    ],
    name: 'UsdcBelowFloor',
    type: 'error',
  },
  { inputs: [], name: 'ZeroAmount', type: 'error' },
  { inputs: [], name: 'ZeroRecipient', type: 'error' },
] as const;
