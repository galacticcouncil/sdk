import { Parachain } from './Parachain';
import { EvmParachain } from './EvmParachain';
import { EvmChain } from './EvmChain';
import { SolanaChain } from './SolanaChain';

export type AnyChain = Parachain | EvmParachain | EvmChain | SolanaChain;

export type AnyParachain = Parachain | EvmParachain;
export type AnyEvmChain = EvmChain | EvmParachain;
