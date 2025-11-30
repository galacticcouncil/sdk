import { Parachain } from './Parachain';
import { EvmParachain } from './EvmParachain';
import { EvmChain } from './EvmChain';
import { SolanaChain } from './SolanaChain';
import { SuiChain } from './SuiChain';

export type AnyChain =
  | Parachain
  | EvmParachain
  | EvmChain
  | SolanaChain
  | SuiChain;

export type AnyParachain = Parachain | EvmParachain;
export type AnyEvmChain = EvmChain | EvmParachain;
