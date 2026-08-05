// Wormhole Executor - the contract a sender pays to have a message delivered
// on the far side. Generic over the message being relayed: it moves no tokens
// and knows nothing about ntt, so `requestBytes` is what names the message to
// deliver (see the ERN1 encoder in xc-cfg).
//
// Distinct from NttManagerWithExecutor, the shim that bundles the ntt transfer
// and this call into one - unusable from hydration, where its unbounded
// `approve` overflows the erc20 precompile's u128 balance.
export const EXECUTOR = [
  {
    inputs: [
      {
        internalType: 'uint16',
        name: 'dstChain',
        type: 'uint16',
      },
      {
        internalType: 'bytes32',
        name: 'dstAddr',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'refundAddr',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'signedQuote',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'requestBytes',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'relayInstructions',
        type: 'bytes',
      },
    ],
    name: 'requestExecution',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
