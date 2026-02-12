export const XCM_TRANSACTOR_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: 'uint8', name: 'parents', type: 'uint8' },
          { internalType: 'bytes[]', name: 'interior', type: 'bytes[]' },
        ],
        internalType: 'struct Multilocation',
        name: 'dest',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'uint8', name: 'parents', type: 'uint8' },
          { internalType: 'bytes[]', name: 'interior', type: 'bytes[]' },
        ],
        internalType: 'struct Multilocation',
        name: 'feeLocation',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'uint64', name: 'refTime', type: 'uint64' },
          { internalType: 'uint64', name: 'proofSize', type: 'uint64' },
        ],
        internalType: 'struct Weight',
        name: 'transactRequiredWeightAtMost',
        type: 'tuple',
      },
      { internalType: 'bytes', name: 'call', type: 'bytes' },
      { internalType: 'uint256', name: 'feeAmount', type: 'uint256' },
      {
        components: [
          { internalType: 'uint64', name: 'refTime', type: 'uint64' },
          { internalType: 'uint64', name: 'proofSize', type: 'uint64' },
        ],
        internalType: 'struct Weight',
        name: 'overallWeight',
        type: 'tuple',
      },
      { internalType: 'bool', name: 'refund', type: 'bool' },
    ],
    name: 'transactThroughSignedMultilocation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint8', name: 'parents', type: 'uint8' },
          { internalType: 'bytes[]', name: 'interior', type: 'bytes[]' },
        ],
        internalType: 'struct Multilocation',
        name: 'dest',
        type: 'tuple',
      },
      { internalType: 'address', name: 'feeLocationAddress', type: 'address' },
      {
        components: [
          { internalType: 'uint64', name: 'refTime', type: 'uint64' },
          { internalType: 'uint64', name: 'proofSize', type: 'uint64' },
        ],
        internalType: 'struct Weight',
        name: 'transactRequiredWeightAtMost',
        type: 'tuple',
      },
      { internalType: 'bytes', name: 'call', type: 'bytes' },
      { internalType: 'uint256', name: 'feeAmount', type: 'uint256' },
      {
        components: [
          { internalType: 'uint64', name: 'refTime', type: 'uint64' },
          { internalType: 'uint64', name: 'proofSize', type: 'uint64' },
        ],
        internalType: 'struct Weight',
        name: 'overallWeight',
        type: 'tuple',
      },
      { internalType: 'bool', name: 'refund', type: 'bool' },
    ],
    name: 'transactThroughSigned',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const XCM_TRANSACTOR_V3 =
  '0x0000000000000000000000000000000000000817' as `0x${string}`;
