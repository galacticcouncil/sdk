export type WormholeChain = {
  id: number;
  tokenBridge: `0x${string}`;
};

const ETHEREUM = {
  id: 2,
  tokenBridge: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585' as `0x${string}`,
};

const ACALA = {
  id: 12,
  tokenBridge: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624' as `0x${string}`,
};

const MOONBEAM = {
  id: 16,
  tokenBridge: '0xb1731c586ca89a23809861c6103f0b96b3f57d92' as `0x${string}`,
};

export const Wormhole: Record<string, WormholeChain> = {
  acala: ACALA,
  ethereum: ETHEREUM,
  moonbeam: MOONBEAM,
};
