import { parseAbi } from 'viem';

/** Intents v2 dispatcher, as the SDK calls it. */
export const DISPATCHER_ABI = parseAbi([
  'struct Quote { address owner; bytes32 quoteId; uint16 maxSlippageBps; uint8 maxFillMultiplier; uint128 minOutPerIn; uint128 minDelivery; uint64 deadline; uint8 recipientKind; address refundTo; string destinationAsset; string recipient; }',
  'function computeTerms(Quote terms) pure returns (bytes)',
  'function computeAuthPath(Quote terms) pure returns (bytes32)',
  'function outPerIn(string destinationAsset) view returns (uint128)',
  'function dispatch(uint256 amount, address depositAddress, uint256 maxRelayFee, Quote terms) returns (uint64)',
  'function close(Quote terms, uint64 delay) payable returns (uint64)',
  'function closed(bytes32 authPath) view returns (bool)',
  'function minOrderAmount() view returns (uint256)',
  'function nttManager() view returns (address)',
  'function wormhole() view returns (address)',
]);

/** NTT manager delivery quote and Wormhole core fee. */
export const ORDER_COST_ABI = parseAbi([
  'function quoteDeliveryPrice(uint16 recipientChain, bytes transceiverInstructions) view returns (uint256[], uint256)',
  'function messageFee() view returns (uint256)',
]);

/** ERC20 subset for the WETH precompile. */
export const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
]);
