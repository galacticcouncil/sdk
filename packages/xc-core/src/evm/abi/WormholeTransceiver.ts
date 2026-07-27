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
] as const;
