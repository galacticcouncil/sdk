export const GHO_TOKEN_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'facilitator', type: 'address' }],
    name: 'getFacilitator',
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'addr', type: 'address' },
          { name: 'label', type: 'bytes32' },
          { name: 'bucketCapacity', type: 'uint128' },
          { name: 'bucketLevel', type: 'uint128' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'facilitator', type: 'address' }],
    name: 'getFacilitatorBucket',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getFacilitatorsList',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'facilitatorAddress',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'label',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'bucketCapacity',
        type: 'uint256',
      },
    ],
    name: 'FacilitatorAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'facilitatorAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldCapacity',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newCapacity',
        type: 'uint256',
      },
    ],
    name: 'FacilitatorBucketCapacityUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'facilitatorAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldLevel',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newLevel',
        type: 'uint256',
      },
    ],
    name: 'FacilitatorBucketLevelUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'facilitatorAddress',
        type: 'address',
      },
    ],
    name: 'FacilitatorRemoved',
    type: 'event',
  },
] as const;
