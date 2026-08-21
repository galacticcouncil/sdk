export const NTT_MANAGER = [
  {
    inputs: [],
    name: 'nextMessageSequence',
    outputs: [
      {
        internalType: 'uint64',
        name: '',
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
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
  {
    inputs: [],
    name: 'rateLimitDuration',
    outputs: [
      {
        internalType: 'uint64',
        name: '',
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentOutboundCapacity',
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
  {
    inputs: [
      {
        internalType: 'uint16',
        name: 'chainId',
        type: 'uint16',
      },
    ],
    name: 'getCurrentInboundCapacity',
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
  {
    inputs: [],
    name: 'getOutboundLimitParams',
    outputs: [
      {
        components: [
          {
            internalType: 'TrimmedAmount',
            name: 'limit',
            type: 'uint72',
          },
          {
            internalType: 'TrimmedAmount',
            name: 'currentCapacity',
            type: 'uint72',
          },
          {
            internalType: 'uint64',
            name: 'lastTxTimestamp',
            type: 'uint64',
          },
        ],
        internalType: 'struct IRateLimiter.RateLimitParams',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint16',
        name: 'chainId',
        type: 'uint16',
      },
    ],
    name: 'getInboundLimitParams',
    outputs: [
      {
        components: [
          {
            internalType: 'TrimmedAmount',
            name: 'limit',
            type: 'uint72',
          },
          {
            internalType: 'TrimmedAmount',
            name: 'currentCapacity',
            type: 'uint72',
          },
          {
            internalType: 'uint64',
            name: 'lastTxTimestamp',
            type: 'uint64',
          },
        ],
        internalType: 'struct IRateLimiter.RateLimitParams',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // `recipient` & `refundAddress` are indexed - they live in the topics,
  // not the data. Decoding them as plain fields silently shifts every
  // value by two (amount reads as the recipient, the chain id as amount).
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'recipient',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'refundAddress',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint16',
        name: 'recipientChain',
        type: 'uint16',
      },
      {
        indexed: false,
        internalType: 'uint64',
        name: 'msgSequence',
        type: 'uint64',
      },
    ],
    name: 'TransferSent',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'digest',
        type: 'bytes32',
      },
    ],
    name: 'TransferSent',
    type: 'event',
  },
] as const;
