/**
 * `IntentEmitter.placeOrder` ABI fragment
 * (see WHM contracts/src/intents/interfaces/IIntentEmitter.sol).
 */
export const PLACE_ORDER_ABI = [
  {
    name: 'placeOrder',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assetIn', type: 'uint32' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minEthOut', type: 'uint256' },
      { name: 'depositAddress', type: 'address' },
      { name: 'maxRelayFee', type: 'uint256' },
    ],
    outputs: [{ name: 'transferSequence', type: 'uint64' }],
  },
] as const;

/**
 * `IntentEmitter.OrderPlaced` — emitted by `placeOrder`.
 *
 * - `transferSequence` is the NTT manager's sequence, not a Wormhole one
 * - It is the key the receiver pairs the settlement and its instruction on
 * - Decode it from the receipt to track an order across chains
 */
export const ORDER_PLACED_ABI = [
  {
    name: 'OrderPlaced',
    type: 'event',
    inputs: [
      { name: 'transferSequence', type: 'uint64', indexed: true },
      { name: 'depositAddress', type: 'address', indexed: true },
      { name: 'caller', type: 'address', indexed: true },
      { name: 'assetIn', type: 'uint32', indexed: false },
      { name: 'amountIn', type: 'uint256', indexed: false },
      { name: 'ethOut', type: 'uint256', indexed: false },
      { name: 'maxRelayFee', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * Emitter config getters.
 *
 * - Both are owner-set, so the rail is read from the emitter itself
 * - Avoids hardcoding addresses that `setNttManager` may re-point
 */
export const EMITTER_CONFIG_ABI = [
  {
    name: 'nttManager',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'wormhole',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

/**
 * NTT manager surface the swap estimate reads.
 *
 * - `quoteDeliveryPrice` prices the settlement, charged against the swap output
 * - `isPaused` and `getCurrentOutboundCapacity` are pre-checks for reverts
 */
export const NTT_MANAGER_ABI = [
  {
    name: 'quoteDeliveryPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'recipientChain', type: 'uint16' },
      { name: 'transceiverInstructions', type: 'bytes' },
    ],
    outputs: [
      { name: 'perTransceiver', type: 'uint256[]' },
      { name: 'total', type: 'uint256' },
    ],
  },
  {
    name: 'isPaused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getCurrentOutboundCapacity',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/** Wormhole core bridge — the per-message publish fee. */
export const WORMHOLE_ABI = [
  {
    name: 'messageFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
