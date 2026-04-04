export const BASEJUMP = [
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes32', name: 'recipient', type: 'bytes32' },
    ],
    name: 'bridgeViaWormhole',
    outputs: [
      { internalType: 'uint64', name: 'transferSequence', type: 'uint64' },
      { internalType: 'uint64', name: 'messageSequence', type: 'uint64' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes', name: 'vaa', type: 'bytes' }],
    name: 'completeTransfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'asset', type: 'address' }],
    name: 'quoteFee',
    outputs: [{ internalType: 'uint256', name: 'fee', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
