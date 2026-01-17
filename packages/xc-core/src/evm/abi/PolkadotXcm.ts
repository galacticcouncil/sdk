export const POLKADOT_XCM = [
  {
    inputs: [
      { internalType: 'uint32', name: 'paraId', type: 'uint32' },
      { internalType: 'bytes32', name: 'beneficiary', type: 'bytes32' },
      {
        components: [
          { internalType: 'address', name: 'asset', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        internalType: 'struct PolkadotXcm.AssetAddressInfo[]',
        name: 'assets',
        type: 'tuple[]',
      },
      { internalType: 'uint32', name: 'feeAssetItem', type: 'uint32' },
    ],
    name: 'transferAssetsToPara32',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
