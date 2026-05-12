export const SNOWBRIDGE_L2_ADAPTOR = [
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
      {
        components: [
          { internalType: 'uint256', name: 'inputAmount', type: 'uint256' },
          { internalType: 'address', name: 'router', type: 'address' },
          { internalType: 'bytes', name: 'callData', type: 'bytes' },
        ],
        internalType: 'struct SwapParams',
        name: 'swapParams',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'bytes', name: 'xcm', type: 'bytes' },
          { internalType: 'bytes[]', name: 'assets', type: 'bytes[]' },
          { internalType: 'bytes', name: 'claimer', type: 'bytes' },
          { internalType: 'uint128', name: 'executionFee', type: 'uint128' },
          { internalType: 'uint128', name: 'relayerFee', type: 'uint128' },
        ],
        internalType: 'struct SendParams',
        name: 'sendParams',
        type: 'tuple',
      },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'bytes32', name: 'topic', type: 'bytes32' },
    ],
    name: 'sendTokenAndCall',
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
      {
        components: [
          { internalType: 'bytes', name: 'xcm', type: 'bytes' },
          { internalType: 'bytes[]', name: 'assets', type: 'bytes[]' },
          { internalType: 'bytes', name: 'claimer', type: 'bytes' },
          { internalType: 'uint128', name: 'executionFee', type: 'uint128' },
          { internalType: 'uint128', name: 'relayerFee', type: 'uint128' },
        ],
        internalType: 'struct SendParams',
        name: 'sendParams',
        type: 'tuple',
      },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'bytes32', name: 'topic', type: 'bytes32' },
    ],
    name: 'sendEtherAndCall',
    outputs: [],
    stateMutability: 'payable',
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
] as const;
