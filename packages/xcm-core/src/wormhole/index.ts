export type WormholeId =
  | 'Ethereum'
  | 'Polygon'
  | 'Fantom'
  | 'Acala'
  | 'Moonbeam';

export type WormholeChain = {
  id: number;
  tokenBridge: `0x${string}`;
};

const ETHEREUM = {
  id: 2,
  tokenBridge: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585' as `0x${string}`,
};

const POLYGON = {
  id: 5,
  tokenBridge: '0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE' as `0x${string}`,
};

const FANTOM = {
  id: 10,
  tokenBridge: '0x7C9Fc5741288cDFdD83CeB07f3ea7e22618D79D2' as `0x${string}`,
};

const ACALA = {
  id: 12,
  tokenBridge: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624' as `0x${string}`,
};

const MOONBEAM = {
  id: 16,
  tokenBridge: '0xb1731c586ca89a23809861c6103f0b96b3f57d92' as `0x${string}`,
};

export const Wormhole: Record<WormholeId, WormholeChain> = {
  Ethereum: ETHEREUM,
  Polygon: POLYGON,
  Fantom: FANTOM,
  Acala: ACALA,
  Moonbeam: MOONBEAM,
};
