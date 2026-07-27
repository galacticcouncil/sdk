export const NTT_MANAGER = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint16',
        name: 'recipientChain',
        type: 'uint16',
      },
      {
        internalType: 'bytes32',
        name: 'recipient',
        type: 'bytes32',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'uint64',
        name: 'msgId',
        type: 'uint64',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint16',
        name: 'recipientChain',
        type: 'uint16',
      },
      {
        internalType: 'bytes32',
        name: 'recipient',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'refundAddress',
        type: 'bytes32',
      },
      {
        internalType: 'bool',
        name: 'shouldQueue',
        type: 'bool',
      },
      {
        internalType: 'bytes',
        name: 'encodedInstructions',
        type: 'bytes',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'uint64',
        name: 'msgId',
        type: 'uint64',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint16',
        name: 'recipientChain',
        type: 'uint16',
      },
      {
        internalType: 'bytes',
        name: 'transceiverInstructions',
        type: 'bytes',
      },
    ],
    name: 'quoteDeliveryPrice',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'digest',
        type: 'bytes32',
      },
    ],
    name: 'completeInboundQueuedTransfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'queueSequence',
        type: 'uint64',
      },
    ],
    name: 'completeOutboundQueuedTransfer',
    outputs: [
      {
        internalType: 'uint64',
        name: 'msgSequence',
        type: 'uint64',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'queueSequence',
        type: 'uint64',
      },
    ],
    name: 'cancelOutboundQueuedTransfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenDecimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
