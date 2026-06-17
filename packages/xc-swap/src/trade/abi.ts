/** Minimal ERC-20 `approve` ABI fragment. */
export const ERC20_APPROVE_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * `IntentEmitter.swapAndBridge` ABI fragment
 * (see WHM contracts/src/intents/interfaces/IIntentEmitter.sol).
 */
export const SWAP_AND_BRIDGE_ABI = [
  {
    name: 'swapAndBridge',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assetIn', type: 'uint32' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minEthOut', type: 'uint256' },
      { name: 'maxFeeIn', type: 'uint256' },
      { name: 'intentId', type: 'bytes32' },
      { name: 'intentDepositAddress', type: 'address' },
      { name: 'maxRelayFee', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;
