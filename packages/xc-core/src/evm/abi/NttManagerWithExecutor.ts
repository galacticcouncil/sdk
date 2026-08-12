// NttManagerWithExecutor - the shim wrapping NttManager.transfer with a paid
// Executor delivery request. Only the erc20 `transfer` overload is declared:
// a native gas source is wrapped into the erc20 upfront (the same prerequisite
// the plain manager needs), so the shim's `transferETH` - which wraps the
// attached msg.value itself - is never the path taken here.
export const NTT_MANAGER_WITH_EXECUTOR = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'nttManager',
        type: 'address',
      },
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
        name: 'recipientAddress',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'refundAddress',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: 'encodedInstructions',
        type: 'bytes',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'refundAddress',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'signedQuote',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'instructions',
            type: 'bytes',
          },
        ],
        internalType: 'struct ExecutorArgs',
        name: 'executorArgs',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'transferTokenFee',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'nativeTokenFee',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'payee',
            type: 'address',
          },
        ],
        internalType: 'struct FeeArgs',
        name: 'feeArgs',
        type: 'tuple',
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
] as const;
