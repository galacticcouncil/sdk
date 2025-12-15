export const HYPERBRIDGE_ISMP_HOST = [
  {
    type: 'function',
    name: 'perByteFee',
    stateMutability: 'view',
    inputs: [{ name: 'stateId', type: 'bytes' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
