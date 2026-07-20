import { erc20 as erc20Utils } from '@galacticcouncil/common';

const { ERC20 } = erc20Utils;

/**
 * keccak256("Transfer(address,address,uint256)") — the topic0 of every
 * ERC20 Transfer event.
 */
export const ERC20_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export type Erc20Transfer = {
  /** asset id the emitting precompile maps to, or null if not an asset ERC20 */
  assetId: number | null;
  /** lower-cased 0x H160 sender */
  from: string;
  /** lower-cased 0x H160 receiver */
  to: string;
};

/**
 * Minimal shape of the runtime EVM.Log payload we depend on. The descriptor
 * types `address`/`topics` as SizedHex (branded hex strings) and `data` as a
 * Uint8Array; we only need the hex address + topics. Kept structural so the
 * decoder can be unit-tested without the full descriptor types.
 */
export type EvmLogLike = {
  log: {
    address: string;
    topics: string[];
    data?: unknown;
  };
};

const normalize = (hex: string) => hex.toLowerCase();

/**
 * A 32-byte indexed address topic is the 20-byte H160 left-padded with
 * 12 zero bytes — strip the padding back to a 0x-prefixed H160.
 */
const topicToAddress = (topic: string): string => {
  const h = normalize(topic).replace(/^0x/, '');
  return '0x' + h.slice(-40);
};

/**
 * Decode an EVM.Log payload as an ERC20 Transfer. Returns undefined for any
 * non-Transfer log (wrong topic0, malformed topics). The emitting contract
 * address is mapped to an asset id via the structural ERC20 precompile prefix
 * (ERC20.toAssetId) — no RPC, same mapping AavePoolClient uses in reverse.
 */
export function decodeErc20Transfer(
  payload: EvmLogLike
): Erc20Transfer | undefined {
  const { address, topics } = payload.log;
  if (!topics || topics.length < 3) return undefined;

  const topic0 = normalize(topics[0]);
  if (topic0 !== ERC20_TRANSFER_TOPIC) return undefined;

  const contract = normalize(address);

  return {
    assetId: ERC20.toAssetId(contract),
    from: topicToAddress(topics[1]),
    to: topicToAddress(topics[2]),
  };
}
