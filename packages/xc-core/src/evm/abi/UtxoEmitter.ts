export const UTXO_EMITTER = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes22', name: 'zcashAddress', type: 'bytes22' },
      { internalType: 'bytes32', name: 'nearAccount', type: 'bytes32' },
    ],
    name: 'send',
    outputs: [{ internalType: 'uint64', name: 'sequence', type: 'uint64' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint64',
        name: 'sequence',
        type: 'uint64',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'nearAccount',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
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
        internalType: 'bytes',
        name: 'destination',
        type: 'bytes',
      },
    ],
    name: 'WithdrawRequested',
    type: 'event',
  },
] as const;
