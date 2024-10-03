import { Parachain } from './Parachain';
import { EvmParachain } from './EvmParachain';
import { EvmChain } from './EvmChain';

export type AnyChain = EvmChain | EvmParachain | Parachain;

export type AnyParachain = Parachain | EvmParachain;
export type AnyEvmChain = EvmChain | EvmParachain;

export type WormholeDef = {
  id: number;
  tokenBridge: `0x${string}`;
  tokenRelayer?: `0x${string}`;
};

export interface Wormhole {
  getWormholeId(): number;
  getTokenBridge(): string;
  getTokenRelayer(): string | undefined;
}
