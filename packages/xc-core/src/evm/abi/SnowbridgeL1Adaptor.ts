export const SNOWBRIDGE_L1_ADAPTOR = [
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'inputToken', type: 'address' },
          { internalType: 'address', name: 'outputToken', type: 'address' },
          { internalType: 'uint256', name: 'inputAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'outputAmount', type: 'uint256' },
          {
            internalType: 'uint256',
            name: 'destinationChainId',
            type: 'uint256',
          },
          {
            internalType: 'uint32',
            name: 'fillDeadlineBuffer',
            type: 'uint32',
          },
        ],
        internalType: 'struct DepositParams',
        name: 'params',
        type: 'tuple',
      },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'bytes32', name: 'topic', type: 'bytes32' },
    ],
    name: 'depositToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'inputToken', type: 'address' },
          { internalType: 'address', name: 'outputToken', type: 'address' },
          { internalType: 'uint256', name: 'inputAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'outputAmount', type: 'uint256' },
          {
            internalType: 'uint256',
            name: 'destinationChainId',
            type: 'uint256',
          },
          {
            internalType: 'uint32',
            name: 'fillDeadlineBuffer',
            type: 'uint32',
          },
        ],
        internalType: 'struct DepositParams',
        name: 'params',
        type: 'tuple',
      },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'bytes32', name: 'topic', type: 'bytes32' },
    ],
    name: 'depositNativeEther',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'bytes32', name: 'topic', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'depositId', type: 'uint256' },
    ],
    name: 'DepositCallInvoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'bytes32', name: 'topic', type: 'bytes32' },
    ],
    name: 'DepositCallFailed',
    type: 'event',
  },
] as const;
