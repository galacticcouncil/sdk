export type WormholeDef = {
  id: number;
  tokenBridge: `0x${string}`;
  tokenRelayer?: `0x${string}`;
};

export interface WormholeChain {
  getWormholeId(): number;
  getTokenBridge(): string;
  getTokenRelayer(): string | undefined;
}
