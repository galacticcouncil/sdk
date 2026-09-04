export const BASEJUMP = [
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes32', name: 'recipient', type: 'bytes32' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
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
    inputs: [{ internalType: 'address', name: 'asset', type: 'address' }],
    name: 'quoteFee',
    outputs: [{ internalType: 'uint256', name: 'fee', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'asset',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      { indexed: false, internalType: 'uint256', name: 'fee', type: 'uint256' },
      {
        indexed: false,
        internalType: 'uint16',
        name: 'destChain',
        type: 'uint16',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'recipient',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint64',
        name: 'transferSequence',
        type: 'uint64',
      },
      {
        indexed: false,
        internalType: 'uint64',
        name: 'messageSequence',
        type: 'uint64',
      },
    ],
    name: 'BridgeInitiated',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'fee', type: 'uint256' },
    ],
    name: 'AmountTooLowForFee',
    type: 'error',
  },
  { inputs: [], name: 'LandingNotSet', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'asset', type: 'address' }],
    name: 'SettlementRouteNotSet',
    type: 'error',
  },
  { inputs: [], name: 'ZeroAmount', type: 'error' },
  { inputs: [], name: 'ZeroAmountReceived', type: 'error' },
] as const;
