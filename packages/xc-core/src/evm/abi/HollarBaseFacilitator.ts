export const HOLLAR_BASE_FACILITATOR = [
  {
    inputs: [],
    name: 'maxRedeemable',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mintHeadroom',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'usdcAmount', type: 'uint256' },
      { internalType: 'address', name: 'baseRecipient', type: 'address' },
      { internalType: 'uint16', name: 'maxFeeBps', type: 'uint16' },
      { internalType: 'uint64', name: 'deadline', type: 'uint64' },
      { internalType: 'bytes32', name: 'ref', type: 'bytes32' },
    ],
    name: 'redeem',
    outputs: [{ internalType: 'uint64', name: 'sequence', type: 'uint64' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'redeemPaused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'requested', type: 'uint256' },
      { internalType: 'uint256', name: 'level', type: 'uint256' },
    ],
    name: 'ExceedsBucketLevel',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'provided', type: 'uint256' },
      { internalType: 'uint256', name: 'required', type: 'uint256' },
    ],
    name: 'InsufficientMessageFee',
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
  {
    inputs: [{ internalType: 'uint64', name: 'deadline', type: 'uint64' }],
    name: 'RedeemExpired',
    type: 'error',
  },
  { inputs: [], name: 'RedeemPaused', type: 'error' },
  { inputs: [], name: 'RefundFailed', type: 'error' },
  { inputs: [], name: 'ZeroAddress', type: 'error' },
] as const;
