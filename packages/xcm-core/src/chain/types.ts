import { Parachain } from './Parachain';
import { EvmParachain } from './EvmParachain';
import { EvmChain } from './EvmChain';

export type AnyChain = Parachain | EvmParachain | EvmChain;
export type AnyParachain = Parachain | EvmParachain;
