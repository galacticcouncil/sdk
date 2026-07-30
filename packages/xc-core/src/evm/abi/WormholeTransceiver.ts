export const WORMHOLE_TRANSCEIVER = [
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'encodedMessage',
        type: 'bytes',
      },
    ],
    name: 'receiveMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'hash',
        type: 'bytes32',
      },
    ],
    name: 'isVAAConsumed',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
