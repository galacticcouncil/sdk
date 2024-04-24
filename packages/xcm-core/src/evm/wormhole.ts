export type WormholeDef = {
  id: number;
  tokenBridge: `0x${string}`;
};

export interface WormholeChain {
  getWormholeId(): number;
  getWormholeBridge(): string;
}
